"""
RAG + Agentic pipeline untuk chatbot LangkahLegal.

Flow:
  1. Rewrite query user (bahasa awam → istilah hukum)
  2. Embed via Voyage AI (voyage-law-2)
  3. Retrieve pasal relevan dari Supabase RPC
  4. Bangun multi-turn contents + panggil Gemini dengan Tool
  5. Jika Gemini minta tool call → eksekusi → kirim FunctionResponse balik
  6. Return jawaban final (text biasa ATAU consultant_list)
"""

import json
import logging
from typing import Optional

import voyageai
from google import genai
from google.genai import types
from supabase import Client

from config import get_settings

log = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────

EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
LLM_MODEL = "gemini-2.5-flash"

# Batas token kasar untuk smart truncation.
# Gemini 2.5 Flash punya context window ~1M token,
# tapi kita batasi history agar response tetap cepat.
MAX_HISTORY_CHARS = 60_000  # ~15k token (1 token ≈ 4 chars)
MAX_TOOL_LOOP = 3

DISCLAIMER = "⚠️ Jawaban ini bukan nasihat hukum resmi. Konsultasikan dengan advokat untuk kepastian hukum."

# ── Prompts ─────────────────────────────────────────────────

QUERY_REWRITER_PROMPT = """Kamu ahli hukum Indonesia. Tugasmu: ubah pertanyaan awam jadi query pencarian hukum yang presisi.

Aturan:
1. Ubah bahasa emosional/sehari-hari → istilah hukum (misal "dipecat" → "PHK sepihak ketenagakerjaan").
2. Gabungkan konteks dari riwayat percakapan jika ada.
3. Output HANYA query pencarian (1-2 kalimat), tanpa penjelasan lain.
4. Sertakan istilah hukum Indonesia yang relevan.

Contoh:
- "tapi saya takut melapor..." (konteks: kekerasan seksual)
  → "perlindungan korban kekerasan seksual hak pelapor jaminan kerahasiaan identitas UU TPKS"
- "bos saya tidak bayar gaji 3 bulan"
  → "pelanggaran pembayaran upah ketenagakerjaan hak pekerja PHK sepihak"
"""

SYSTEM_PROMPT = """Kamu adalah "Kia", paralegal virtual di LangkahLegal.

KEPRIBADIAN:
- Hangat, empatik, suportif — bukan robot pembaca pasal.
- Validasi perasaan user terlebih dahulu, terutama kalau topiknya sensitif.
- Pakai bahasa sehari-hari, jelaskan istilah hukum kalau muncul.
- Jangan perkenalkan diri di setiap jawaban.

SOP WAWANCARA (WAJIB URUT — jangan loncat tahap):

STEP 1 — GALI KRONOLOGI
Saat klien menceritakan masalah, JANGAN langsung kasih kesimpulan hukum.
- Validasi perasaan mereka.
- Tanyakan detail: kapan kejadian, siapa pihak terlibat, di mana, sudah lakukan apa.

STEP 2 — ANALISIS HUKUM
Setelah info cukup:
- Jelaskan pelanggaran hukum apa yang MUNGKIN terjadi.
- Gunakan konteks pasal yang diberikan, tapi JANGAN baca mentah — jelaskan maknanya.
- Sebutkan dasar hukum (UU + pasal) sebagai referensi.

STEP 3 — VALIDASI BUKTI
Sebelum tawarkan konsultan, WAJIB tanyakan apakah klien punya bukti:
- Kontrak/Surat Perjanjian, Foto/Video/Rekaman, Laporan Polisi
- Kwitansi/Bukti Transfer, Saksi
Ingatkan bahwa bukti SANGAT PENTING untuk kelanjutan kasus.

STEP 4 — TAWARKAN KONSULTAN (TOOL CALL)
Panggil search_consultants HANYA jika:
a) Step 1-3 sudah dilalui DAN klien siap berkonsultasi lebih lanjut, ATAU
b) Klien EKSPLISIT minta: "carikan pengacara", "saya butuh advokat", dll.

Tentukan parameter `kategori` berdasarkan analisis kasus.

ATURAN JAWAB:
- Bahasa Indonesia sederhana.
- Pakai poin bernomor untuk langkah konkret.
- Jangan kasih nasihat ilegal.
- Akhiri dengan pertanyaan lanjutan ATAU saran langkah berikutnya.

LARANGAN:
- Jangan sebut "Sumber 1", "Sumber 2" — itu internal.
- Jangan bilang "berdasarkan konteks pasal yang diberikan" — kedengeran robot.
- Jangan panggil search_consultants sebelum minimal Step 1 & Step 2, kecuali user eksplisit minta.
"""

# ── Tool Definition ─────────────────────────────────────────

CONSULTANT_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="search_consultants",
            description=(
                "Cari konsultan hukum/advokat di LangkahLegal berdasarkan spesialisasi dan budget. "
                "HANYA panggil setelah tahap wawancara selesai ATAU klien eksplisit minta."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "kategori": {
                        "type": "string",
                        "description": "Spesialisasi hukum konsultan. Pilih SALAH SATU dari enum.",
                        "enum": [
                            "Pidana",
                            "Perdata",
                            "Ketenagakerjaan",
                            "Teknologi Informasi",
                            "HAM",
                            "Umum",
                        ],
                    },
                    "max_budget": {
                        "type": "integer",
                        "description": (
                            "Budget maksimal per sesi (Rupiah). "
                            "Jangan sertakan kalau klien tidak menyebut budget."
                        ),
                    },
                },
                "required": ["kategori"],
            },
        )
    ]
)


# ── Client Helpers ──────────────────────────────────────────

def _get_voyage_client() -> voyageai.Client:
    return voyageai.Client()


def _get_gemini_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.google_api_key)


# ── Query Rewriting ─────────────────────────────────────────

def rewrite_query(raw_query: str, chat_history: list[dict] = None) -> str:
    """Terjemahkan query awam → query hukum presisi, dengan konteks history."""
    client = _get_gemini_client()

    # Bangun konteks singkat dari history terakhir (untuk rewriter saja).
    # Ini boleh pakai format sederhana karena tujuannya cuma bikin search query,
    # bukan percakapan multi-turn.
    history_snippet = ""
    if chat_history:
        lines = []
        for msg in chat_history[-6:]:
            role = "User" if msg.get("role") == "user" else "Kia"
            content = msg.get("content", msg.get("text", ""))
            lines.append(f"{role}: {content[:300]}")
        history_snippet = "\n".join(lines)

    prompt = (
        f"RIWAYAT PERCAKAPAN:\n{history_snippet or '(Tidak ada)'}\n\n"
        f"PESAN TERBARU USER:\n{raw_query}\n\n"
        f"Tuliskan query pencarian hukum yang optimal:"
    )

    try:
        resp = client.models.generate_content(
            model=LLM_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=QUERY_REWRITER_PROMPT,
                temperature=0.1,
                max_output_tokens=150,
            ),
        )
        rewritten = resp.text.strip().strip('"').strip("'")
        log.info(f"[REWRITE] '{raw_query[:50]}' → '{rewritten[:80]}'")
        return rewritten
    except Exception as e:
        log.warning(f"[REWRITE] Gagal, pakai query asli: {e}")
        return raw_query


# ── Embedding & Retrieval ───────────────────────────────────

def embed_query(query: str) -> list[float]:
    """Embed query pakai Voyage AI (input_type=query)."""
    client = _get_voyage_client()
    result = client.embed([query], model=EMBEDDING_MODEL, input_type="query")
    return result.embeddings[0]


def retrieve_pasals(
    supabase: Client,
    query_embedding: list[float],
    match_count: int = 5,
    match_threshold: float = 0.5,
    filter_kategori: Optional[str] = None,
) -> list[dict]:
    """Panggil RPC match_dokumen_hukum untuk ambil pasal relevan."""
    params = {
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
        "match_count": match_count,
    }
    if filter_kategori:
        params["filter_kategori"] = filter_kategori

    result = supabase.rpc("match_dokumen_hukum", params).execute()
    return result.data or []


def _build_context(pasals: list[dict]) -> str:
    """Rangkai teks konteks pasal untuk disisipkan ke prompt."""
    if not pasals:
        return ""

    parts = []
    for i, p in enumerate(pasals, 1):
        sim = round(p.get("similarity", 0) * 100, 1)
        header = f"[Sumber {i}] {p.get('nama_uu', '')} — {p.get('pasal_bagian', '')}"
        if p.get("judul_bab"):
            header += f" ({p['judul_bab']})"
        header += f" [Relevansi: {sim}%]"
        parts.append(f"{header}\n{p.get('isi_teks', '')}")

    return "\n\n---\n\n".join(parts)


def _build_references(pasals: list[dict]) -> list[dict]:
    """Bangun list referensi pasal untuk response frontend."""
    return [
        {
            "nama_uu": p.get("nama_uu", ""),
            "nomor_uu": p.get("nomor_uu", ""),
            "pasal_bagian": p.get("pasal_bagian", ""),
            "judul_bab": p.get("judul_bab", ""),
            "similarity": round(p.get("similarity", 0), 4),
        }
        for p in pasals
    ]


# ── Tool Execution ──────────────────────────────────────────

def _execute_tool(supabase: Client, fn_name: str, fn_args: dict) -> dict:
    """Eksekusi tool call dari Gemini, return dict untuk FunctionResponse."""
    if fn_name != "search_consultants":
        return {"error": f"Unknown tool: {fn_name}"}

    kategori = fn_args.get("kategori", "Umum")
    max_budget = fn_args.get("max_budget")

    params = {}
    if kategori:
        params["p_spesialisasi"] = kategori
    if max_budget is not None:
        params["p_max_budget"] = max_budget

    try:
        result = supabase.rpc("search_consultants_by_category", params).execute()
        consultants = result.data or []
        log.info(f"[TOOL] search_consultants → {len(consultants)} hasil (kategori={kategori})")
        return {"consultants": consultants, "count": len(consultants)}
    except Exception as e:
        log.error(f"[TOOL] search_consultants gagal: {e}")
        return {"error": str(e), "consultants": []}


# ── Contents Builder ────────────────────────────────────────

def _summarize_consultants(consultants: list[dict]) -> str:
    """Bikin ringkasan singkat daftar konsultan untuk konteks history."""
    if not consultants:
        return "Tidak ditemukan konsultan."
    names = [c.get("nama_lengkap", "?") for c in consultants[:5]]
    return f"Ditemukan {len(consultants)} konsultan: {', '.join(names)}"


def _build_contents(
    chat_history: list[dict],
    user_query: str,
    pasal_context: str,
) -> list[types.Content]:
    """
    Konversi chat history dari DB + query terbaru → list[types.Content]
    yang siap dikirim ke Gemini.

    Setiap pesan jadi Content terpisah dengan role user/model.
    Pesan AI yang punya metadata consultant_list ditambahkan ringkasan
    agar Gemini tau "oh, saya sudah pernah kasih rekomendasi konsultan."
    """
    contents: list[types.Content] = []

    for msg in chat_history:
        raw_role = msg.get("role", "user")
        role = "user" if raw_role == "user" else "model"
        text = msg.get("content", msg.get("text", ""))

        # Kalau ini pesan AI yang mengandung hasil konsultan, tambahin ringkasan
        meta = msg.get("metadata") or {}
        if role == "model" and meta.get("type") == "consultant_list":
            consultant_data = meta.get("consultants", [])
            summary = _summarize_consultants(consultant_data)
            text = f"{text}\n\n[Konteks internal: {summary}]"

        if text.strip():
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=text)])
            )

    # Pesan user terbaru — query dan konteks pasal jadi Part terpisah
    # supaya user input terisolasi dari instruksi (defense prompt injection)
    user_parts = [types.Part.from_text(text=user_query)]
    if pasal_context:
        user_parts.append(
            types.Part.from_text(
                text=f"\n---\nKONTEKS PASAL HUKUM YANG RELEVAN:\n{pasal_context}"
            )
        )
    contents.append(types.Content(role="user", parts=user_parts))

    return contents


def _smart_truncate(contents: list[types.Content]) -> list[types.Content]:
    """
    Potong pesan history dari AWAL (oldest-first) kalau total karakter
    melebihi batas. Pesan terakhir (query user terbaru) TIDAK pernah dipotong.
    """
    if not contents:
        return contents

    # Pesan terakhir = query user terbaru, jangan disentuh
    last_msg = contents[-1]
    history = contents[:-1]

    total_chars = sum(
        sum(len(p.text or "") for p in c.parts if hasattr(p, "text"))
        for c in history
    )

    # Buang dari awal sampai di bawah limit
    while total_chars > MAX_HISTORY_CHARS and history:
        removed = history.pop(0)
        removed_chars = sum(
            len(p.text or "") for p in removed.parts if hasattr(p, "text")
        )
        total_chars -= removed_chars
        log.info(f"[TRUNCATE] Buang 1 pesan lama ({removed_chars} chars), sisa {total_chars}")

    return history + [last_msg]


# ── Agentic Generation ──────────────────────────────────────

def agentic_generate(
    query: str,
    context: str,
    chat_history: list[dict] = None,
    supabase: Client = None,
) -> dict:
    """
    Panggil Gemini dengan Tool support. Kalau Gemini minta tool call,
    eksekusi fungsinya lalu kirim FunctionResponse balik ke Gemini
    (true agentic loop). Gemini yang merangkai jawaban final.

    Return dict:
      - {"type": "text", "jawaban": "..."}
      - {"type": "consultant_list", "jawaban": "...", "consultants": [...]}
    """
    client = _get_gemini_client()

    # Bangun contents array (structured multi-turn)
    contents = _build_contents(chat_history or [], query, context)
    contents = _smart_truncate(contents)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.4,
        max_output_tokens=2048,
        tools=[CONSULTANT_TOOL],
    )

    consultants_found = []
    AVAILABLE_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"]

    # Agentic loop — maksimal MAX_TOOL_LOOP iterasi
    for iteration in range(MAX_TOOL_LOOP):
        log.info(f"[AGENT] Generate iteration {iteration + 1}/{MAX_TOOL_LOOP}")

        response = None
        for model_name in AVAILABLE_MODELS:
            try:
                log.info(f"[AGENT] Mencoba model: {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                break # Berhasil
            except Exception as e:
                if "429" in str(e):
                    log.warning(f"[AGENT] Model {model_name} terkena limit 429. Mencoba fallback...")
                    continue
                else:
                    raise e # Lempar jika bukan 429
        
        if response is None:
            # Semua model di loop terkena 429
            raise Exception("429 RESOURCE_EXHAUSTED: Semua model fallback terkena limit.")

        # Kalau tidak ada function call, berarti Gemini sudah punya jawaban final
        if not response.function_calls:
            break

        # Gemini minta panggil tool
        fc = response.function_calls[0]
        log.info(f"[AGENT] Tool call: {fc.name}({fc.args})")

        if not supabase:
            log.error("[AGENT] Tool call tapi supabase client None, skip")
            break

        # Eksekusi tool
        tool_result = _execute_tool(supabase, fc.name, fc.args or {})

        # Simpan konsultan kalau ada
        if fc.name == "search_consultants":
            consultants_found = tool_result.get("consultants", [])

        # Append turn model (function call) + turn tool (function response)
        # ke contents, lalu loop lagi biar Gemini baca hasilnya
        contents.append(response.candidates[0].content)
        contents.append(
            types.Content(
                role="tool",
                parts=[
                    types.Part.from_function_response(
                        name=fc.name,
                        response=tool_result,
                    )
                ],
            )
        )
    else:
        # Loop habis tanpa break = Gemini terus-terusan minta tool call
        log.warning(f"[AGENT] Tool loop habis setelah {MAX_TOOL_LOOP} iterasi")

    # Ambil text jawaban dari response terakhir
    jawaban = ""
    try:
        jawaban = response.text or ""
    except Exception:
        # response.text bisa raise kalau isinya cuma function_call tanpa text
        jawaban = "Maaf, saya mengalami kesulitan memproses permintaan Anda. Silakan coba lagi."

    # Tentukan tipe response
    if consultants_found:
        return {
            "type": "consultant_list",
            "jawaban": jawaban,
            "consultants": consultants_found,
        }

    return {"type": "text", "jawaban": jawaban}


# ── Main Triage Pipeline ────────────────────────────────────

def triage(
    query: str,
    supabase: Client,
    kategori: Optional[str] = None,
    chat_history: list[dict] = None,
) -> dict:
    """
    Pipeline utama RAG + Agentic.
      1. Rewrite query
      2. Embed
      3. Retrieve pasal (threshold 0.5 only, no fallback)
      4. Agentic generate
      5. Return structured response
    """
    log.info(f"[TRIAGE] Query masuk: {query[:100]}")

    # 1. Rewrite (Conditional)
    if len(query.split()) < 5:
        log.info(f"[TRIAGE] Query singkat (<5 kata), melakukan rewrite...")
        search_query = rewrite_query(query, chat_history)
    else:
        log.info(f"[TRIAGE] Query panjang (>=5 kata), skip rewrite untuk hemat kuota.")
        search_query = query

    # 2. Embed
    query_embedding = embed_query(search_query)
    log.info(f"[TRIAGE] Embedded (dim={len(query_embedding)})")

    # 3. Retrieve — single threshold, no fallback cocoklogi
    pasals = retrieve_pasals(
        supabase=supabase,
        query_embedding=query_embedding,
        match_count=5,
        match_threshold=0.5,
        filter_kategori=kategori,
    )
    log.info(f"[TRIAGE] {len(pasals)} pasal ditemukan")

    # 4. Build context & references
    context = _build_context(pasals)
    references = _build_references(pasals)

    # 5. Agentic generate
    result = agentic_generate(
        query=query,
        context=context,
        chat_history=chat_history,
        supabase=supabase,
    )
    log.info(f"[TRIAGE] Result type: {result['type']}")

    # 6. Return
    return {
        "type": result["type"],
        "jawaban": result["jawaban"],
        "consultants": result.get("consultants", []),
        "pasal_referensi": references,
        "disclaimer": DISCLAIMER,
    }
