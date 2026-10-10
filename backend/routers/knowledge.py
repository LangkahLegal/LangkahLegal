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

import logging
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from limiter import limiter
from schemas.knowledge import (
    KnowledgeDocumentDetail,
    PasalDetailResponse,
    PasalListResponse,
)

log = logging.getLogger(__name__)
router = APIRouter()

RATE_LIMIT = "30/minute"

DOC_COLS = "frbr_uri, nama_uu, nomor_uu, tahun_uu, kategori, status_hukum"
PASAL_COLS = "id_dokumen, pasal_bagian, judul_bab, isi_teks"

_FRBR_URI_RE = re.compile(r"^/akn/[A-Za-z0-9/_.\-]{1,200}$")
_SEARCH_UNSAFE_RE = re.compile(r"[,()*%\\]")


# ── Helpers ─────────────────────────────────────────────

def _validate_frbr_uri(frbr_uri: str) -> str:
    if not _FRBR_URI_RE.match(frbr_uri) or ".." in frbr_uri:
        raise HTTPException(422, "Format frbr_uri tidak valid.")
    return frbr_uri


def _document_from_row(row: dict) -> dict:
    return {
        "frbr_uri": row["frbr_uri"],
        "nama_uu": row.get("nama_uu"),
        "nomor_uu": row.get("nomor_uu"),
        "tahun_uu": row.get("tahun_uu"),
        "kategori": row.get("kategori"),
        "status_hukum": row.get("status_hukum"),
        "has_file": False,  # PDF asli belum disimpan (lihat rencana PR 2)
    }


# ── Endpoints ───────────────────────────────────────────

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
    result = (
        db.table("dokumen_hukum")
        .select(f"{PASAL_COLS}, {DOC_COLS}")
        .eq("id_dokumen", id_dokumen)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Pasal tidak ditemukan. Dokumen mungkin sudah diperbarui.")

    row = result.data[0]
    return {
        "id_dokumen": row["id_dokumen"],
        "pasal_bagian": row["pasal_bagian"],
        "judul_bab": row.get("judul_bab"),
        "isi_teks": row["isi_teks"],
        "document": _document_from_row(row),
    }


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
    _validate_frbr_uri(frbr_uri)

    result = (
        db.table("dokumen_hukum")
        .select(DOC_COLS, count="exact")
        .eq("frbr_uri", frbr_uri)
        .order("id_dokumen")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Dokumen tidak ditemukan.")

    return {**_document_from_row(result.data[0]), "total_pasal": result.count or 0}


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
    _validate_frbr_uri(frbr_uri)

    query = db.table("dokumen_hukum").select(PASAL_COLS, count="exact").eq("frbr_uri", frbr_uri)

    search_term = _SEARCH_UNSAFE_RE.sub(" ", search).strip() if search else ""
    if search_term:
        query = query.or_(f"pasal_bagian.ilike.%{search_term}%,isi_teks.ilike.%{search_term}%")

    offset = (page - 1) * page_size
    result = query.order("id_dokumen").range(offset, offset + page_size - 1).execute()

    total = result.count or 0
    if total == 0 and not search_term:
        raise HTTPException(404, "Dokumen tidak ditemukan.")

    return {"data": result.data or [], "total": total, "page": page, "page_size": page_size}
