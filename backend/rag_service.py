"""
LangkahLegal RAG Service
========================
Handles the core RAG pipeline:
  1. Rewrite user query using conversation context (query augmentation)
  2. Embed optimized query via Voyage AI (voyage-law-2, input_type="query")
  3. Retrieve relevant pasals from Supabase (match_dokumen_hukum RPC)
  4. Build context and call Gemini for answer generation
  5. Return structured response with citations and disclaimer
"""

import logging
from typing import Optional

import voyageai
from google import genai
from google.genai import types
from supabase import Client

from config import get_settings

log = logging.getLogger(__name__)

# ============================================================
# CONSTANTS
# ============================================================
EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIM = 1024
LLM_MODEL = "gemini-2.5-flash-lite"

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

# --- Main System Prompt ---
SYSTEM_PROMPT = """Kamu adalah "Kia", konsultan hukum virtual LangkahLegal yang hangat, empatik, dan profesional.
Tugasmu memberikan P3K Hukum (Pertolongan Pertama pada Permasalahan Hukum) untuk masyarakat awam.

KEPRIBADIAN:
- Bicara seperti konsultan yang ramah, BUKAN robot yang membacakan pasal.
- Validasi perasaan pengguna terlebih dahulu sebelum membahas hukum.
- Gunakan bahasa sehari-hari yang mudah dipahami, jelaskan istilah hukum jika muncul.
- Berikan rasa aman dan dukungan — pengguna mungkin sedang dalam situasi sulit.

ATURAN MENJAWAB:
1. Jika pengguna menceritakan pengalaman traumatis/sulit, MULAI dengan validasi emosi:
   "Saya turut prihatin mendengar apa yang Anda alami..." atau "Perasaan takut Anda sangat wajar..."
2. Jawab dalam Bahasa Indonesia yang sederhana dan mudah dipahami.
3. Gunakan informasi dari konteks pasal yang diberikan, tapi JANGAN membacakan pasal secara mentah — jelaskan maknanya.
4. Jika konteks pasal kurang relevan tapi kamu tahu topik umumnya, berikan panduan umum lalu sarankan konsultasi lanjutan.
5. Selalu sebutkan dasar hukum yang relevan (nama UU dan pasal), tapi sebagai referensi pendukung bukan inti jawaban.
6. Gunakan poin-poin bernomor untuk langkah-langkah konkret.
7. Jangan pernah memberikan nasihat untuk melakukan tindakan ilegal.
8. Akhiri dengan saran langkah selanjutnya yang KONKRET dan BISA DILAKUKAN.

FORMAT JAWABAN:
- Respons empatik (1-2 kalimat, jika topik sensitif)
- Ringkasan situasi hukum (1-2 kalimat)
- Langkah-langkah konkret (poin bernomor)
- Informasi kontak/resource jika relevan
- Saran untuk konsultasi lebih lanjut

YANG TIDAK BOLEH DILAKUKAN:
- Jangan menyebutkan "Sumber 1", "Sumber 2", dll — itu internal.
- Jangan bilang "berdasarkan konteks pasal yang diberikan" — itu terasa seperti robot.
- Jangan bilang "cukup jelas" jika sebuah pasal hanya bertuliskan itu — skip dan fokus pasal lain.
- Jangan memperkenalkan diri di setiap jawaban — cukup di pesan pertama saja.
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

# ============================================================
# CORE FUNCTIONS
# ============================================================

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
    
    Example:
      raw: "tapi saya takut melapor..."
      history: [{"role":"user","text":"ingin melaporkan kekerasan seksual"}]
      → "perlindungan korban kekerasan seksual hak pelapor jaminan kerahasiaan UU TPKS"
    """
    client = _get_gemini_client()
    
    # Build conversation context
    history_text = ""
    if chat_history:
        recent = chat_history[-6:]  # Last 3 turns (user+ai pairs)
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
    """Embed a user query using Voyage AI with input_type='query'.
    
    IMPORTANT: input_type='query' is different from 'document' used during indexing.
    This is required for optimal retrieval performance with Voyage AI models.
    """
    client = _get_voyage_client()
    result = client.embed(
        [query],
        model=EMBEDDING_MODEL,
        input_type="query",  # CRITICAL: 'query' for search, 'document' for indexing
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


def generate_answer(query: str, context: str, chat_history: list[dict] = None) -> str:
    """Call Gemini to generate an answer based on the retrieved context and chat history."""
    client = _get_gemini_client()
    
    # Build conversation history for context
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

Jawab pesan user dengan gaya konsultan hukum yang empatis dan mudah dipahami."""

    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.4,
            max_output_tokens=2048,
        ),
    )
    
    return response.text


# ============================================================
# MAIN RAG PIPELINE
# ============================================================

def triage(
    query: str,
    supabase: Client,
    kategori: Optional[str] = None,
    chat_history: list[dict] = None,
) -> dict:
    """
    Main RAG triage pipeline with query rewriting and conversation memory.
    
    1. Rewrite query using conversation context (casual → legal terms)
    2. Embed rewritten query
    3. Retrieve relevant pasals (with retry at lower threshold)
    4. Generate empathetic answer with Gemini
    5. Return structured response
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
    
    # Step 4: Handle no results — still generate empathetic response
    if not pasals:
        return {
            "jawaban": NO_RESULTS_MSG,
            "pasal_referensi": [],
            "disclaimer": DISCLAIMER,
        }
    
    # Step 5: Build context and generate answer
    context = _build_context(pasals)
    jawaban = generate_answer(query, context, chat_history)
    references = _build_references(pasals)
    
    log.info(f"[RAG] Answer generated ({len(jawaban)} chars), {len(references)} refs")
    
    return {
        "jawaban": jawaban,
        "pasal_referensi": references,
        "disclaimer": DISCLAIMER,
    }
