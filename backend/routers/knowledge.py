"""
Knowledge Base Router (Publik, read-only)
==========================================
Endpoint untuk user membuka sumber dokumen peraturan yang dipakai chatbot
(daftar "Sumber dokumen" di bawah jawaban AI).

  - GET /pasal/{id_dokumen}          → Isi 1 pasal + metadata dokumennya
  - GET /documents/detail?frbr_uri=  → Metadata dokumen + total pasal
  - GET /documents/pasal?frbr_uri=   → Daftar pasal 1 dokumen (paginasi + search)

Prefix: /api/v1/knowledge
frbr_uri dikirim via query param karena mengandung "/" (konsisten dengan admin_docs).
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from limiter import limiter
from schemas.knowledge import (
    KnowledgeDocumentDetail,
    PasalDetailResponse,
    PasalListResponse,
)
from services import knowledge_service

router = APIRouter()

RATE_LIMIT = "30/minute"


@router.get(
    "/pasal/{id_dokumen}",
    response_model=PasalDetailResponse,
    summary="Isi 1 pasal beserta metadata dokumennya",
    description="""
Dipanggil saat user mengklik chip pasal pada daftar "Sumber dokumen" di bawah jawaban chatbot.
Mengembalikan 404 jika pasal sudah tidak ada (misal dokumen di-replace admin setelah jawaban dibuat).
    """,
)
@limiter.limit(RATE_LIMIT)
def get_pasal(
    request: Request,
    id_dokumen: int,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.get_pasal(db, id_dokumen)


@router.get(
    "/documents/detail",
    response_model=KnowledgeDocumentDetail,
    summary="Metadata 1 dokumen peraturan + total pasal",
)
@limiter.limit(RATE_LIMIT)
def get_document_detail(
    request: Request,
    frbr_uri: str = Query(..., description="FRBR URI dokumen, misal /akn/id/act/uu-13-2003"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.get_document_detail(db, frbr_uri)


@router.get(
    "/documents/pasal",
    response_model=PasalListResponse,
    summary="Daftar pasal dari 1 dokumen (paginasi + pencarian)",
    description="""
Dipakai untuk membaca dokumen utuh dari chatbot ("Lihat semua pasal").
Urutan mengikuti urutan pasal saat dokumen diproses. Field `search` mencari di nomor pasal dan isi teks.
    """,
)
@limiter.limit(RATE_LIMIT)
def list_document_pasal(
    request: Request,
    frbr_uri: str = Query(..., description="FRBR URI dokumen"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100, description="Cari nomor pasal atau isi teks"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.list_document_pasal(db, frbr_uri, page, page_size, search)
