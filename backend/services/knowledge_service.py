import re
from typing import Optional

from supabase import Client

from core.exceptions import AppError, NotFoundError

DOC_COLS = "frbr_uri, nama_uu, nomor_uu, tahun_uu, kategori, status_hukum"
PASAL_COLS = "id_dokumen, pasal_bagian, judul_bab, isi_teks"

_FRBR_URI_RE = re.compile(r"^/akn/[A-Za-z0-9/_.\-]{1,200}$")
_SEARCH_UNSAFE_RE = re.compile(r"[,()*%\\]")


def _validate_frbr_uri(frbr_uri: str) -> str:
    if not _FRBR_URI_RE.match(frbr_uri) or ".." in frbr_uri:
        raise AppError("Format frbr_uri tidak valid.", status_code=422)
    return frbr_uri


def _document_from_row(row: dict) -> dict:
    return {
        "frbr_uri": row["frbr_uri"],
        "nama_uu": row.get("nama_uu"),
        "nomor_uu": row.get("nomor_uu"),
        "tahun_uu": row.get("tahun_uu"),
        "kategori": row.get("kategori"),
        "status_hukum": row.get("status_hukum"),
        "has_file": False,
    }


def get_pasal(db: Client, id_dokumen: int) -> dict:
    result = (
        db.table("dokumen_hukum")
        .select(f"{PASAL_COLS}, {DOC_COLS}")
        .eq("id_dokumen", id_dokumen)
        .execute()
    )
    if not result.data:
        raise NotFoundError("Pasal tidak ditemukan. Dokumen mungkin sudah diperbarui.")

    row = result.data[0]
    return {
        "id_dokumen": row["id_dokumen"],
        "pasal_bagian": row["pasal_bagian"],
        "judul_bab": row.get("judul_bab"),
        "isi_teks": row["isi_teks"],
        "document": _document_from_row(row),
    }


def get_document_detail(db: Client, frbr_uri: str) -> dict:
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
        raise NotFoundError("Dokumen tidak ditemukan.")

    return {**_document_from_row(result.data[0]), "total_pasal": result.count or 0}


def list_document_pasal(
    db: Client,
    frbr_uri: str,
    page: int,
    page_size: int,
    search: Optional[str],
) -> dict:
    _validate_frbr_uri(frbr_uri)

    query = db.table("dokumen_hukum").select(PASAL_COLS, count="exact").eq("frbr_uri", frbr_uri)

    search_term = _SEARCH_UNSAFE_RE.sub(" ", search).strip() if search else ""
    if search_term:
        query = query.or_(f"pasal_bagian.ilike.%{search_term}%,isi_teks.ilike.%{search_term}%")

    offset = (page - 1) * page_size
    result = query.order("id_dokumen").range(offset, offset + page_size - 1).execute()

    total = result.count or 0
    if total == 0 and not search_term:
        raise NotFoundError("Dokumen tidak ditemukan.")

    return {"data": result.data or [], "total": total, "page": page, "page_size": page_size}
