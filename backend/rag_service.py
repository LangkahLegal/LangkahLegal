"""
LangkahLegal RAG Service
========================
Handles the core RAG pipeline:
  1. Embed user query via Voyage AI (voyage-law-2, input_type="query")
  2. Retrieve relevant pasals from Supabase (match_dokumen_hukum RPC)
  3. Build context and call Gemini for answer generation
  4. Return structured response with citations and disclaimer
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
LLM_MODEL = "gemini-2.0-flash"

SYSTEM_PROMPT = """Kamu adalah asisten hukum LangkahLegal bernama "Kia". 
Tugasmu memberikan P3K Hukum (Pertolongan Pertama pada Permasalahan Hukum) untuk situasi pra-litigasi.

ATURAN KETAT:
1. Jawab dalam Bahasa Indonesia yang sederhana dan mudah dipahami oleh masyarakat awam.
2. Gunakan HANYA informasi dari konteks pasal yang diberikan di bawah. Jangan mengarang informasi hukum di luar konteks.
3. Jika ada dua versi UU (lama vs baru, misal KUHP Lama dan KUHP Baru), jelaskan perbedaannya dan sebutkan mana yang berlaku saat ini.
4. Selalu sebutkan pasal-pasal yang relevan dalam jawabanmu.
5. Gunakan format yang rapi: poin-poin bernomor untuk langkah-langkah, bold untuk istilah penting.
6. Jika konteks tidak cukup untuk menjawab pertanyaan, katakan dengan jujur bahwa kamu tidak menemukan pasal yang relevan.
7. Jangan pernah memberikan nasihat untuk melakukan tindakan ilegal.
8. Ingatkan pengguna bahwa ini bukan nasihat hukum resmi di akhir jawaban.

FORMAT JAWABAN:
- Mulai dengan ringkasan singkat (1-2 kalimat).
- Lanjutkan dengan penjelasan detail menggunakan konteks pasal.
- Akhiri dengan saran langkah selanjutnya jika relevan.
"""

DISCLAIMER = "⚠️ Jawaban ini bukan nasihat hukum resmi. Konsultasikan dengan advokat untuk kepastian hukum."

NO_RESULTS_MSG = "Maaf, saya tidak menemukan pasal yang relevan dengan pertanyaan Anda. Silakan coba dengan pertanyaan yang lebih spesifik, atau konsultasikan langsung dengan advokat."

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


def generate_answer(query: str, context: str) -> str:
    """Call Gemini to generate an answer based on the retrieved context."""
    client = _get_gemini_client()
    
    user_prompt = f"""PERTANYAAN PENGGUNA:
{query}

KONTEKS PASAL HUKUM YANG RELEVAN:
{context}

Berdasarkan konteks pasal di atas, jawab pertanyaan pengguna dengan bahasa yang mudah dipahami."""

    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.3,
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
) -> dict:
    """
    Main RAG triage pipeline.
    
    1. Embed user query
    2. Retrieve relevant pasals (with retry at lower threshold)
    3. Generate answer with Gemini
    4. Return structured response
    """
    log.info(f"[RAG] Query: {query[:100]}...")
    
    # Step 1: Embed the query
    query_embedding = embed_query(query)
    log.info(f"[RAG] Query embedded (dim={len(query_embedding)})")
    
    # Step 2: Retrieve pasals with primary threshold
    pasals = retrieve_pasals(
        supabase=supabase,
        query_embedding=query_embedding,
        match_count=5,
        match_threshold=0.5,
        filter_kategori=kategori,
    )
    log.info(f"[RAG] Retrieved {len(pasals)} pasals (threshold=0.5)")
    
    # Step 2b: Retry with lower threshold if < 3 results
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
    
    # Step 3: Handle no results
    if not pasals:
        return {
            "jawaban": NO_RESULTS_MSG,
            "pasal_referensi": [],
            "disclaimer": DISCLAIMER,
        }
    
    # Step 4: Build context and generate answer
    context = _build_context(pasals)
    jawaban = generate_answer(query, context)
    references = _build_references(pasals)
    
    log.info(f"[RAG] Answer generated ({len(jawaban)} chars), {len(references)} refs")
    
    return {
        "jawaban": jawaban,
        "pasal_referensi": references,
        "disclaimer": DISCLAIMER,
    }
