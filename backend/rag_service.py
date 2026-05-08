"""
LangkahLegal RAG Service — Agentic Pipeline
=============================================
Handles the core RAG + Agentic pipeline:
  1. Rewrite user query using conversation context (query augmentation)
  2. Embed optimized query via Voyage AI (voyage-law-2, input_type="query")
  3. Retrieve relevant pasals from Supabase (match_dokumen_hukum RPC)
  4. Call Gemini with Tools (function calling) for agentic response
  5. Route response: text answer OR consultant_list (tool call)
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

EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
LLM_MODEL = "gemini-2.5-flash"

# --- Query Rewriter Prompt ---
# Translates casual/emotional user input into a precise legal search query
QUERY_REWRITER_PROMPT = """Kamu adalah ahli hukum Indonesia. Tugasmu adalah menerjemahkan pertanyaan dari orang awam menjadi query pencarian hukum yang presisi.

ATURAN:
1. Ubah bahasa sehari-hari/emosional menjadi istilah hukum yang tepat.
2. Jika ada riwayat percakapan, GABUNGKAN konteks dari pesan sebelumnya.
3. Hasilkan HANYA query pencarian (1-2 kalimat), tanpa penjelasan.
4. Sertakan istilah hukum Indonesia yang relevan (misal: "tindak pidana", "perlindungan saksi", "hak korban").
5. Jika user berbicara tentang ketakutan/keraguan melapor, arahkan ke "perlindungan saksi dan korban" atau "hak korban dalam proses hukum".

CONTOH:
- User: "tapi saya takut melapor..." (konteks: kekerasan seksual)
  → "perlindungan korban kekerasan seksual hak pelapor jaminan kerahasiaan identitas UU TPKS"
- User: "tetangga saya ribut terus tiap malam"
  → "tindak pidana kebisingan gangguan ketertiban umum tetangga"
- User: "bos saya tidak bayar gaji 3 bulan"
  → "pelanggaran pembayaran upah ketenagakerjaan hak pekerja PHK sepihak"
"""

# --- Agentic System Prompt (SOP 4-Step) ---
SYSTEM_PROMPT = """Kamu adalah "Kia", paralegal virtual di LangkahLegal — konsultan hukum AI yang hangat, empatik, dan sangat terstruktur.
Tugasmu adalah melakukan "triase hukum" layaknya seorang paralegal profesional yang mewawancarai klien sebelum menghubungkan mereka dengan advokat.

═══════════════════════════════════════
KEPRIBADIAN
═══════════════════════════════════════
- Bicara seperti paralegal yang ramah dan suportif, BUKAN robot pembaca pasal.
- Validasi perasaan pengguna terlebih dahulu sebelum masuk ke hukum.
- Gunakan bahasa sehari-hari yang mudah dipahami, jelaskan istilah hukum jika muncul.
- Berikan rasa aman — pengguna mungkin sedang dalam situasi sulit.

═══════════════════════════════════════
SOP WAWANCARA (WAJIB DIIKUTI)
═══════════════════════════════════════

Kamu WAJIB mengikuti alur wawancara ini secara BERURUTAN. JANGAN melompati tahap.

1. STEP 1 — GALI INFORMASI
Saat klien pertama kali menceritakan masalah, JANGAN langsung memberikan kesimpulan hukum atau memanggil tool.
Lakukan:
- Validasi perasaan klien jika topiknya sensitif.
- Tanyakan detail kronologi: kapan kejadian, siapa pihak terlibat, di mana lokasi.
- Tanyakan apa yang sudah dilakukan klien sejauh ini.
Contoh: "Terima kasih sudah menceritakan ini. Untuk membantu lebih baik, boleh ceritakan lebih detail kronologinya? Kapan kejadiannya, dan siapa saja pihak yang terlibat?"

2. STEP 2 — VALIDASI KASUS (GUNAKAN KONTEKS PASAL)
Setelah info cukup, jelaskan kepada klien:
- Pelanggaran hukum apa yang MUNGKIN terjadi berdasarkan kronologi mereka.
- Gunakan informasi dari KONTEKS PASAL yang diberikan, tapi JANGAN membacakan pasal mentah — jelaskan maknanya.
- Sebutkan dasar hukum (nama UU dan pasal) sebagai referensi pendukung.
Contoh: "Berdasarkan cerita Anda, tindakan ini BISA dikategorikan sebagai tindak pidana penggelapan berdasarkan Pasal 372 KUHP..."

3. STEP 3 — VALIDASI DOKUMEN / BUKTI
Setelah klien memahami posisi hukumnya, tanyakan apakah mereka memiliki bukti:
- Kontrak/Surat Perjanjian
- Foto/Video/Rekaman
- Laporan Polisi/Surat Pengaduan
- Kwitansi/Bukti Transfer
- Saksi
Contoh: "Sebelum melangkah lebih jauh, apakah Anda memiliki bukti-bukti berikut? Ini akan sangat membantu jika kasus ini akan ditindaklanjuti secara hukum..."

4. STEP 4 — TAWARKAN KONSULTAN (TOOL CALL)
Panggil fungsi `search_consultants` HANYA jika:
1. Tahap 1-3 sudah selesai dilalui, DAN kamu yakin klien siap berkonsultasi lebih lanjut, ATAU
2. Klien secara EKSPLISIT meminta: "Carikan pengacara", "Saya butuh advokat", "Hubungkan saya dengan konsultan", dll.

Saat memanggil tool, tentukan parameter `kategori` berdasarkan analisis kasusnya (Pidana/Perdata/Ketenagakerjaan/dll).

═══════════════════════════════════════
ATURAN MENJAWAB
═══════════════════════════════════════
1. Jawab dalam Bahasa Indonesia yang sederhana.
2. Gunakan poin-poin bernomor untuk langkah-langkah konkret.
3. Jangan pernah memberikan nasihat untuk melakukan tindakan ilegal.
4. Akhiri dengan pertanyaan lanjutan ATAU saran langkah selanjutnya.

YANG TIDAK BOLEH DILAKUKAN:
- Jangan menyebutkan "Sumber 1", "Sumber 2" — itu internal.
- Jangan bilang "berdasarkan konteks pasal yang diberikan" — itu terasa robot.
- Jangan bilang "cukup jelas" jika pasal hanya bertuliskan itu.
- Jangan memperkenalkan diri di setiap jawaban.
- JANGAN panggil search_consultants sebelum minimal Step 1 dan Step 2 selesai, KECUALI user secara eksplisit memintanya.
"""

DISCLAIMER = "⚠️ Jawaban ini bukan nasihat hukum resmi. Konsultasikan dengan advokat untuk kepastian hukum."

NO_RESULTS_MSG = (
    "Saya memahami kekhawatiran Anda. Sayangnya, saya belum menemukan pasal yang secara spesifik "
    "membahas hal ini dalam database kami. Namun, saya sangat menyarankan Anda untuk:\n\n"
    "1. **Menghubungi LBH (Lembaga Bantuan Hukum)** terdekat untuk konsultasi gratis\n"
    "2. **Hubungi hotline bantuan hukum**: 021-3145508 (YLBHI)\n"
    "3. **Konsultasi dengan advokat** melalui fitur konsultasi di LangkahLegal\n\n"
    "Anda tidak sendirian, dan ada banyak pihak yang siap membantu."
)

# TOOL DEFINITION — Gemini Function Calling

SEARCH_CONSULTANTS_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="search_consultants",
            description=(
                "Cari konsultan hukum/advokat yang tersedia di LangkahLegal berdasarkan spesialisasi dan budget. "
                "Panggil fungsi ini HANYA jika klien sudah melewati tahap wawancara (Step 1-3) "
                "ATAU secara eksplisit meminta untuk dihubungkan dengan konsultan/pengacara/advokat."
            ),
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "kategori": {
                        "type": "string",
                        "description": (
                            "Kategori spesialisasi hukum konsultan yang dicari. "
                            "Pilih salah satu: Pidana, Perdata, Ketenagakerjaan, Teknologi Informasi, HAM, Umum. "
                            "Tentukan berdasarkan analisis kasus klien."
                        ),
                        "enum": ["Pidana", "Perdata", "Ketenagakerjaan", "Teknologi Informasi", "HAM", "Umum"],
                    },
                    "max_budget": {
                        "type": "integer",
                        "description": (
                            "Budget maksimal klien per sesi konsultasi dalam Rupiah. "
                            "Jika klien tidak menyebutkan budget, JANGAN sertakan parameter ini."
                        ),
                    },
                },
                "required": ["kategori"],
            },
        )
    ]
)


# CORE FUNCTIONS

def _get_voyage_client() -> voyageai.Client:
    """Initialize Voyage AI client. Uses VOYAGE_API_KEY env var automatically."""
    return voyageai.Client()


def _get_gemini_client() -> genai.Client:
    """Initialize Google GenAI client with API key."""
    settings = get_settings()
    return genai.Client(api_key=settings.google_api_key)


def rewrite_query(raw_query: str, chat_history: list[dict] = None) -> str:
    """
    Use Gemini to translate a casual/emotional user query into a precise 
    legal search query, incorporating conversation history for context.
    """
    client = _get_gemini_client()
    
    # Build conversation context
    history_text = ""
    if chat_history:
        recent = chat_history[-6:]  
        history_parts = []
        for msg in recent:
            role_label = "User" if msg.get("role") == "user" else "Kia"
            history_parts.append(f"{role_label}: {msg.get('text', '')[:300]}")
        history_text = "\n".join(history_parts)
    
    prompt = f"""RIWAYAT PERCAKAPAN:
{history_text if history_text else "(Tidak ada riwayat)"}

PESAN TERBARU USER:
{raw_query}

Tuliskan query pencarian hukum yang optimal untuk menemukan pasal relevan:"""

    try:
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=QUERY_REWRITER_PROMPT,
                temperature=0.1,
                max_output_tokens=150,
            ),
        )
        rewritten = response.text.strip().strip('"').strip("'")
        log.info(f"[RAG] Query rewritten: '{raw_query[:50]}...' → '{rewritten[:80]}...'")
        return rewritten
    except Exception as e:
        log.warning(f"[RAG] Query rewrite failed, using original: {e}")
        return raw_query


def embed_query(query: str) -> list[float]:
    """Embed a user query using Voyage AI with input_type='query'."""
    client = _get_voyage_client()
    result = client.embed(
        [query],
        model=EMBEDDING_MODEL,
        input_type="query",
    )
    return result.embeddings[0]


def retrieve_pasals(
    supabase: Client,
    query_embedding: list[float],
    match_count: int = 5,
    match_threshold: float = 0.5,
    filter_kategori: Optional[str] = None,
) -> list[dict]:
    """Call the match_dokumen_hukum RPC to retrieve relevant pasals."""
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
    """Build a context string from retrieved pasals for Gemini prompt."""
    if not pasals:
        return ""
    
    context_parts = []
    for i, p in enumerate(pasals, 1):
        similarity_pct = round(p.get("similarity", 0) * 100, 1)
        header = f"[Sumber {i}] {p.get('nama_uu', 'N/A')} — {p.get('pasal_bagian', 'N/A')}"
        if p.get("judul_bab"):
            header += f" ({p['judul_bab']})"
        header += f" [Relevansi: {similarity_pct}%]"
        
        context_parts.append(f"{header}\n{p.get('isi_teks', '')}")
    
    return "\n\n---\n\n".join(context_parts)


def _build_references(pasals: list[dict]) -> list[dict]:
    """Build the pasal_referensi list from retrieved pasals."""
    refs = []
    for p in pasals:
        refs.append({
            "nama_uu": p.get("nama_uu", ""),
            "nomor_uu": p.get("nomor_uu", ""),
            "pasal_bagian": p.get("pasal_bagian", ""),
            "judul_bab": p.get("judul_bab", ""),
            "similarity": round(p.get("similarity", 0), 4),
        })
    return refs

# TOOL EXECUTION — search_consultants

def search_consultants(supabase: Client, kategori: str, max_budget: int = None) -> list[dict]:
    """
    Search for available legal consultants from the database.
    Called by Gemini via function calling when Kia determines
    the client is ready for a consultant referral.
    """
    params = {}
    if kategori:
        params["p_spesialisasi"] = kategori
    if max_budget is not None:
        params["p_max_budget"] = max_budget

    try:
        result = supabase.rpc("search_consultants_by_category", params).execute()
        consultants = result.data or []
        log.info(f"[AGENT] Found {len(consultants)} consultants for kategori='{kategori}', budget={max_budget}")
        return consultants
    except Exception as e:
        log.error(f"[AGENT] Consultant search failed: {e}")
        return []

# AGENTIC GENERATION — Gemini with Tools
def agentic_generate(
    query: str,
    context: str,
    chat_history: list[dict] = None,
    supabase: Client = None,
) -> dict:
    """
    Call Gemini with function calling tools enabled.
    
    Returns:
        dict with either:
        - {"type": "text", "jawaban": "..."} for normal text responses
        - {"type": "consultant_list", "jawaban": "...", "consultants": [...]} for tool calls
    """
    client = _get_gemini_client()
    
    # Build conversation history
    history_text = ""
    if chat_history:
        recent = chat_history[-6:]
        history_parts = []
        for msg in recent:
            role_label = "User" if msg.get("role") == "user" else "Kia"
            history_parts.append(f"{role_label}: {msg.get('text', '')[:500]}")
        history_text = "RIWAYAT PERCAKAPAN:\n" + "\n".join(history_parts) + "\n\n"
    
    user_prompt = f"""{history_text}PESAN TERBARU USER:
{query}

KONTEKS PASAL HUKUM YANG RELEVAN:
{context if context else "(Tidak ada pasal yang ditemukan)"}

Jawab pesan user sesuai SOP wawancara. Jika sudah siap rekomendasikan konsultan, panggil fungsi search_consultants."""

    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.4,
            max_output_tokens=2048,
            tools=[SEARCH_CONSULTANTS_TOOL],
        ),
    )
    
    # Check if Gemini wants to call a function
    if response.function_calls:
        fc = response.function_calls[0]
        log.info(f"[AGENT] Tool call detected: {fc.name}({fc.args})")
        
        if fc.name == "search_consultants" and supabase:
            args = fc.args or {}
            consultants = search_consultants(
                supabase=supabase,
                kategori=args.get("kategori", "Umum"),
                max_budget=args.get("max_budget"),
            )
            
            if consultants:
                # Build a human-readable summary to accompany the cards
                consultant_names = [c.get("nama_lengkap", "N/A") for c in consultants]
                summary = (
                    f"Berdasarkan analisis kasus Anda, saya menemukan {len(consultants)} konsultan hukum "
                    f"dengan spesialisasi **{args.get('kategori', 'Umum')}** yang bisa membantu lebih lanjut. "
                    f"Silakan pilih konsultan yang sesuai dengan kebutuhan Anda dan jadwalkan konsultasi."
                )
            else:
                summary = (
                    f"Mohon maaf, saat ini belum ada konsultan dengan spesialisasi "
                    f"**{args.get('kategori', 'Umum')}** yang tersedia. "
                    f"Silakan coba lagi nanti atau hubungi LBH terdekat untuk bantuan hukum gratis."
                )
            
            return {
                "type": "consultant_list",
                "jawaban": summary,
                "consultants": consultants,
            }
    
    # Normal text response
    return {
        "type": "text",
        "jawaban": response.text,
    }

# MAIN RAG PIPELINE (AGENTIC)

def triage(
    query: str,
    supabase: Client,
    kategori: Optional[str] = None,
    chat_history: list[dict] = None,
) -> dict:
    """
    Main Agentic RAG triage pipeline.
    
    1. Rewrite query using conversation context (casual → legal terms)
    2. Embed rewritten query
    3. Retrieve relevant pasals (with retry at lower threshold)
    4. Call Gemini with Tools for agentic response
    5. Return structured response (text OR consultant_list)
    """
    log.info(f"[RAG] Raw query: {query[:100]}...")
    
    # Step 1: Rewrite query for better retrieval
    search_query = rewrite_query(query, chat_history)
    
    # Step 2: Embed the rewritten query
    query_embedding = embed_query(search_query)
    log.info(f"[RAG] Search query embedded (dim={len(query_embedding)})")
    
    # Step 3: Retrieve pasals with primary threshold
    pasals = retrieve_pasals(
        supabase=supabase,
        query_embedding=query_embedding,
        match_count=5,
        match_threshold=0.5,
        filter_kategori=kategori,
    )
    log.info(f"[RAG] Retrieved {len(pasals)} pasals (threshold=0.5)")
    
    # Step 3b: Retry with lower threshold if < 3 results
    if len(pasals) < 3:
        log.info("[RAG] Too few results, retrying with threshold=0.35...")
        pasals = retrieve_pasals(
            supabase=supabase,
            query_embedding=query_embedding,
            match_count=5,
            match_threshold=0.35,
            filter_kategori=kategori,
        )
        log.info(f"[RAG] Retry retrieved {len(pasals)} pasals (threshold=0.35)")
    
    # Step 4: Build context from retrieved pasals
    context = _build_context(pasals)
    references = _build_references(pasals) if pasals else []
    
    # Step 5: Agentic generation (Gemini with Tools)
    agent_result = agentic_generate(
        query=query,
        context=context,
        chat_history=chat_history,
        supabase=supabase,
    )
    
    log.info(f"[RAG] Agent result type: {agent_result['type']}")
    
    # Step 6: Build final response
    if agent_result["type"] == "consultant_list":
        return {
            "type": "consultant_list",
            "jawaban": agent_result["jawaban"],
            "consultants": agent_result.get("consultants", []),
            "pasal_referensi": references,
            "disclaimer": DISCLAIMER,
        }
    else:
        # Handle no pasal results with fallback message
        jawaban = agent_result["jawaban"]
        if not pasals and not chat_history:
            jawaban = NO_RESULTS_MSG
        
        return {
            "type": "text",
            "jawaban": jawaban,
            "pasal_referensi": references,
            "disclaimer": DISCLAIMER,
        }
