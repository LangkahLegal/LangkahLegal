import logging
from typing import Optional

import voyageai
from google import genai
from google.genai import types
from supabase import Client

from core.config import get_settings
from repositories import consultant_repository, legal_document_repository

log = logging.getLogger(__name__)


EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
LLM_MODEL = "gemini-2.5-flash"


MAX_HISTORY_CHARS = 60_000
MAX_TOOL_LOOP = 3

SOURCE_MIN_SIMILARITY = 0.6
SOURCE_MAX_DOCUMENTS = 3

DISCLAIMER = "⚠️ Jawaban ini bukan nasihat hukum resmi. Konsultasikan dengan advokat untuk kepastian hukum."


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


def _get_voyage_client() -> voyageai.Client:
    return voyageai.Client()


def _get_gemini_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.google_api_key)


def rewrite_query(raw_query: str, chat_history: list[dict] = None) -> str:
    client = _get_gemini_client()


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


def embed_query(query: str) -> list[float]:
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
    params = {
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
        "match_count": match_count,
    }
    if filter_kategori:
        params["filter_kategori"] = filter_kategori

    rows = legal_document_repository.match_by_embedding(supabase, params)
    for row in rows:
        if "id_dokumen" not in row:
            row["id_dokumen"] = row.get("id")
    return rows


def _build_context(pasals: list[dict]) -> str:
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
    return [
        {
            "id_dokumen": p.get("id_dokumen"),
            "frbr_uri": p.get("frbr_uri"),
            "nama_uu": p.get("nama_uu", ""),
            "nomor_uu": p.get("nomor_uu", ""),
            "pasal_bagian": p.get("pasal_bagian", ""),
            "judul_bab": p.get("judul_bab", ""),
            "similarity": round(p.get("similarity", 0), 4),
        }
        for p in pasals
    ]


def _build_source_documents(
    pasals: list[dict],
    min_similarity: float = SOURCE_MIN_SIMILARITY,
    max_documents: int = SOURCE_MAX_DOCUMENTS,
) -> list[dict]:
    groups: dict[str, dict] = {}
    for p in pasals:
        frbr_uri = p.get("frbr_uri")
        id_dokumen = p.get("id_dokumen")
        similarity = round(p.get("similarity", 0), 4)
        if not frbr_uri or id_dokumen is None or similarity < min_similarity:
            continue

        doc = groups.setdefault(frbr_uri, {
            "frbr_uri": frbr_uri,
            "nama_uu": p.get("nama_uu"),
            "nomor_uu": p.get("nomor_uu"),
            "tahun_uu": p.get("tahun_uu"),
            "kategori": p.get("kategori"),
            "status_hukum": p.get("status_hukum"),
            "has_file": False,
            "pasal": [],
        })
        doc["pasal"].append({
            "id_dokumen": id_dokumen,
            "pasal_bagian": p.get("pasal_bagian", ""),
            "similarity": similarity,
        })

    for doc in groups.values():
        doc["pasal"].sort(key=lambda x: x["similarity"], reverse=True)

    docs = sorted(groups.values(), key=lambda d: d["pasal"][0]["similarity"], reverse=True)
    return docs[:max_documents]


def _attach_document_status(supabase: Client, sources: list[dict]) -> list[dict]:
    if not sources:
        return sources

    try:
        rows = legal_document_repository.list_statuses_by_uris(
            supabase, [s["frbr_uri"] for s in sources]
        )
        status_by_uri = {r["frbr_uri"]: r.get("status_hukum") for r in rows}
    except Exception as e:
        log.warning(f"[TRIAGE] Gagal ambil status_hukum sumber dokumen: {e}")
        return sources

    for s in sources:
        s["status_hukum"] = status_by_uri.get(s["frbr_uri"], s.get("status_hukum"))
    return sources


def _execute_tool(supabase: Client, fn_name: str, fn_args: dict) -> dict:
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
        consultants = consultant_repository.search_by_category(supabase, params)
        log.info(f"[TOOL] search_consultants → {len(consultants)} hasil (kategori={kategori})")
        return {"consultants": consultants, "count": len(consultants)}
    except Exception as e:
        log.error(f"[TOOL] search_consultants gagal: {e}")
        return {"error": str(e), "consultants": []}


def _summarize_consultants(consultants: list[dict]) -> str:
    if not consultants:
        return "Tidak ditemukan konsultan."
    names = [c.get("nama_lengkap", "?") for c in consultants[:5]]
    return f"Ditemukan {len(consultants)} konsultan: {', '.join(names)}"


def _build_contents(
    chat_history: list[dict],
    user_query: str,
    pasal_context: str,
) -> list[types.Content]:
    contents: list[types.Content] = []

    for msg in chat_history:
        raw_role = msg.get("role", "user")
        role = "user" if raw_role == "user" else "model"
        text = msg.get("content", msg.get("text", ""))


        meta = msg.get("metadata") or {}
        if role == "model" and meta.get("type") == "consultant_list":
            consultant_data = meta.get("consultants", [])
            summary = _summarize_consultants(consultant_data)
            text = f"{text}\n\n[Konteks internal: {summary}]"

        if text.strip():
            contents.append(
                types.Content(role=role, parts=[types.Part.from_text(text=text)])
            )


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
    if not contents:
        return contents


    last_msg = contents[-1]
    history = contents[:-1]

    total_chars = sum(
        sum(len(p.text or "") for p in c.parts if hasattr(p, "text"))
        for c in history
    )


    while total_chars > MAX_HISTORY_CHARS and history:
        removed = history.pop(0)
        removed_chars = sum(
            len(p.text or "") for p in removed.parts if hasattr(p, "text")
        )
        total_chars -= removed_chars
        log.info(f"[TRUNCATE] Buang 1 pesan lama ({removed_chars} chars), sisa {total_chars}")

    return history + [last_msg]


def agentic_generate(
    query: str,
    context: str,
    chat_history: list[dict] = None,
    supabase: Client = None,
) -> dict:
    client = _get_gemini_client()


    contents = _build_contents(chat_history or [], query, context)
    contents = _smart_truncate(contents)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.4,
        max_output_tokens=2048,
        tools=[CONSULTANT_TOOL],
    )

    consultants_found = []
    AVAILABLE_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
    MAX_RETRIES = 2


    for iteration in range(MAX_TOOL_LOOP):
        log.info(f"[AGENT] Generate iteration {iteration + 1}/{MAX_TOOL_LOOP}")

        response = None
        for retry in range(MAX_RETRIES + 1):
            for model_name in AVAILABLE_MODELS:
                try:
                    log.info(f"[AGENT] Mencoba model: {model_name} (retry={retry})")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config,
                    )
                    break
                except Exception as e:
                    err_str = str(e)
                    if "429" in err_str or "503" in err_str or "UNAVAILABLE" in err_str:
                        log.warning(f"[AGENT] Model {model_name} tidak tersedia ({type(e).__name__}). Mencoba fallback...")
                        continue
                    else:
                        raise e
            
            if response is not None:
                break
            
            if retry < MAX_RETRIES:
                import time
                wait_time = 2 * (retry + 1)
                log.warning(f"[AGENT] Semua model gagal, retry setelah {wait_time}s...")
                time.sleep(wait_time)
        
        if response is None:

            raise Exception("RESOURCE_EXHAUSTED: Semua model tidak tersedia setelah retry (429/503).")


        if not response.function_calls:
            break


        fc = response.function_calls[0]
        log.info(f"[AGENT] Tool call: {fc.name}({fc.args})")

        if not supabase:
            log.error("[AGENT] Tool call tapi supabase client None, skip")
            break


        tool_result = _execute_tool(supabase, fc.name, fc.args or {})


        if fc.name == "search_consultants":
            consultants_found = tool_result.get("consultants", [])


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

        log.warning(f"[AGENT] Tool loop habis setelah {MAX_TOOL_LOOP} iterasi")


    jawaban = ""
    try:
        jawaban = response.text or ""
    except Exception:

        jawaban = "Maaf, saya mengalami kesulitan memproses permintaan Anda. Silakan coba lagi."


    if consultants_found:
        return {
            "type": "consultant_list",
            "jawaban": jawaban,
            "consultants": consultants_found,
        }

    return {"type": "text", "jawaban": jawaban}


def triage(
    query: str,
    supabase: Client,
    kategori: Optional[str] = None,
    chat_history: list[dict] = None,
) -> dict:
    log.info(f"[TRIAGE] Query masuk: {query[:100]}")
    current_step = "init"

    try:

        current_step = "rewrite"
        if len(query.split()) < 5:
            log.info("[TRIAGE] Query singkat (<5 kata), melakukan rewrite...")
            search_query = rewrite_query(query, chat_history)
        else:
            log.info("[TRIAGE] Query panjang (>=5 kata), skip rewrite untuk hemat kuota.")
            search_query = query


        current_step = "embed"
        query_embedding = embed_query(search_query)
        log.info(f"[TRIAGE] Embedded (dim={len(query_embedding)})")


        current_step = "retrieve"
        pasals = retrieve_pasals(
            supabase=supabase,
            query_embedding=query_embedding,
            match_count=5,
            match_threshold=0.5,
            filter_kategori=kategori,
        )
        log.info(f"[TRIAGE] {len(pasals)} pasal ditemukan")


        current_step = "build_context"
        context = _build_context(pasals)
        references = _build_references(pasals)
        sources = _attach_document_status(supabase, _build_source_documents(pasals))


        current_step = "agentic_generate"
        result = agentic_generate(
            query=query,
            context=context,
            chat_history=chat_history,
            supabase=supabase,
        )
        log.info(f"[TRIAGE] Result type: {result['type']}")


        return {
            "type": result["type"],
            "jawaban": result["jawaban"],
            "consultants": result.get("consultants", []),
            "pasal_referensi": references,
            "sumber_dokumen": sources,
            "disclaimer": DISCLAIMER,
        }
    except Exception as e:
        log.error(f"[TRIAGE] Error at step '{current_step}': {type(e).__name__}: {e}", exc_info=True)
        raise RuntimeError(f"RAG pipeline failed at step '{current_step}': {type(e).__name__}: {str(e)[:200]}") from e

