"""
LangkahLegal Chatbot Router
============================
Endpoint untuk chatbot AI berbasis RAG.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from supabase import Client

from database import get_supabase_client
from rag_service import triage

log = logging.getLogger(__name__)

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class ChatHistoryMessage(BaseModel):
    role: str = Field(..., description="'user' atau 'ai'")
    text: str


class TriageRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Pertanyaan hukum dari pengguna",
        examples=["Apa hukuman untuk pencurian?"],
    )
    kategori: Optional[str] = Field(
        None,
        description="Filter kategori hukum (opsional): pidana, perdata, ketenagakerjaan, hak_asasi_manusia, teknologi_informasi, umum",
    )
    session_id: Optional[str] = Field(
        None,
        description="ID sesi untuk tracking percakapan (opsional)",
    )
    chat_history: Optional[list[ChatHistoryMessage]] = Field(
        None,
        description="Riwayat percakapan sebelumnya untuk konteks (opsional, max 6 pesan terakhir)",
    )


class PasalReference(BaseModel):
    nama_uu: Optional[str] = ""
    nomor_uu: Optional[str] = ""
    pasal_bagian: str
    judul_bab: Optional[str] = None
    similarity: float


class TriageResponse(BaseModel):
    jawaban: str
    pasal_referensi: list[PasalReference]
    disclaimer: str


# ============================================================
# ENDPOINTS
# ============================================================

@router.post(
    "/triage",
    response_model=TriageResponse,
    summary="Chatbot RAG Triage",
    description="""
Endpoint utama chatbot LangkahLegal. Menerima pertanyaan hukum dari pengguna,
mencari pasal-pasal yang relevan dari database hukum Indonesia, dan menghasilkan
jawaban P3K Hukum menggunakan AI.

**Cara kerja:**
1. Pertanyaan pengguna diubah menjadi embedding menggunakan Voyage AI
2. Embedding dicari kecocokannya dengan pasal-pasal di database (cosine similarity)
3. Pasal-pasal yang relevan digunakan sebagai konteks untuk Gemini AI
4. Gemini menghasilkan jawaban dalam Bahasa Indonesia yang mudah dipahami

**Kategori yang tersedia:** pidana, perdata, ketenagakerjaan, hak_asasi_manusia, teknologi_informasi, umum
""",
)
async def chatbot_triage(request: TriageRequest):
    """
    Menerima pertanyaan hukum dan mengembalikan jawaban berbasis RAG
    beserta referensi pasal yang relevan.
    """
    try:
        supabase = get_supabase_client()
        
        # Convert chat history to dicts for the service
        history = None
        if request.chat_history:
            history = [msg.model_dump() for msg in request.chat_history[-6:]]
        
        result = triage(
            query=request.query,
            supabase=supabase,
            kategori=request.kategori,
            chat_history=history,
        )
        
        return TriageResponse(**result)
        
    except Exception as e:
        log.error(f"[CHATBOT] Error processing triage: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi. Error: {str(e)}",
        )
