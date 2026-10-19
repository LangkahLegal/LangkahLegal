import re
from typing import Optional

from supabase import Client

from core.exceptions import AppError, NotFoundError
from helpers.peraturan_files import get_file_info
from repositories import legal_document_repository

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
        **get_file_info(row["frbr_uri"]),
    }


def get_pasal(db: Client, id_dokumen: int) -> dict:
    row = legal_document_repository.get_by_id(db, id_dokumen, f"{PASAL_COLS}, {DOC_COLS}")
    if row is None:
        raise NotFoundError("Pasal tidak ditemukan. Dokumen mungkin sudah diperbarui.")

    return {
        "id_dokumen": row["id_dokumen"],
        "pasal_bagian": row["pasal_bagian"],
        "judul_bab": row.get("judul_bab"),
        "isi_teks": row["isi_teks"],
        "document": _document_from_row(row),
    }


def get_document_detail(db: Client, frbr_uri: str) -> dict:
    _validate_frbr_uri(frbr_uri)

    row, total_pasal = legal_document_repository.get_first_by_uri(db, frbr_uri, DOC_COLS)
    if row is None:
        raise NotFoundError("Dokumen tidak ditemukan.")

    return {**_document_from_row(row), "total_pasal": total_pasal}


def list_document_pasal(
    db: Client,
    frbr_uri: str,
    page: int,
    page_size: int,
    search: Optional[str],
) -> dict:
    _validate_frbr_uri(frbr_uri)

    search_term = _SEARCH_UNSAFE_RE.sub(" ", search).strip() if search else ""
    offset = (page - 1) * page_size

    rows, total = legal_document_repository.list_by_uri_with_count(
        db, frbr_uri, PASAL_COLS, offset, page_size, search_term or None
    )

    if total == 0 and not search_term:
        raise NotFoundError("Dokumen tidak ditemukan.")

    return {"data": rows, "total": total, "page": page, "page_size": page_size}
