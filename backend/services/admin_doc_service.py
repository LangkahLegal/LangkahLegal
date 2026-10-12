import logging
import uuid
from datetime import datetime
from typing import Optional

import voyageai
from fastapi import UploadFile
from supabase import Client

from core.constants import Role
from core.database import get_supabase_client
from core.exceptions import BadRequestError, InternalError, NotFoundError
from schemas.admin_docs import (
    DocumentReplaceForm,
    DocumentUploadForm,
    PaginatedResponse,
    UpdateChunkRequest,
)
from helpers.access import require_role
from repositories import legal_document_repository
from services.doc_processing import (
    generate_embeddings,
    process_pdf_to_records,
)

log = logging.getLogger(__name__)

SELECT_COLS = (
    "id_dokumen, frbr_uri, node_id, node_type, kategori, "
    "nama_uu, nomor_uu, tahun_uu, status_hukum, sumber_undang_undang, "
    "pasal_bagian, judul_bab, isi_teks, created_at, updated_at"
)

INSERT_BATCH_SIZE = 40
MIN_PDF_BYTES = 100
MAX_PDF_BYTES = 50 * 1024 * 1024

_jobs: dict[str, dict] = {}


def _require_admin(user: dict):
    require_role(user, Role.ADMIN, "Akses ditolak. Hanya admin.")


def _embed_single(text: str) -> list[float]:
    client = voyageai.Client()
    resp = client.embed([text], model="voyage-law-2", input_type="document")
    return resp.embeddings[0]


def _build_frbr_uri(nomor_uu: str | None, tahun_uu: int | None, default: str | None) -> str | None:
    if nomor_uu and tahun_uu:
        nomor_clean = str(nomor_uu).strip().replace(" ", "-").lower()
        return f"/akn/id/act/uu-{nomor_clean}-{tahun_uu}"
    return default


def _build_manual_metadata(form: DocumentUploadForm, default_frbr_uri: str | None) -> dict:
    has_number = form.nomor_uu and form.tahun_uu
    return {
        "nama_uu": form.nama_uu,
        "nomor_uu": f"UU No. {form.nomor_uu} Tahun {form.tahun_uu}" if has_number else None,
        "tahun_uu": form.tahun_uu,
        "kategori": form.kategori,
        "status_hukum": form.status_hukum,
        "frbr_uri": _build_frbr_uri(form.nomor_uu, form.tahun_uu, default=default_frbr_uri)
    }


class DocumentAlreadyExists(Exception):
    pass


def _register_job(message: str, frbr_uri: str | None = None) -> dict:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "message": message,
        "frbr_uri": frbr_uri,
        "total_chunks": None,
        "error": None,
    }
    return _jobs[job_id]


def _mark_failed(job: dict, error: str, message: str) -> None:
    job["status"] = "failed"
    job["error"] = error
    job["message"] = message


def _build_rows(job: dict, pdf_bytes: bytes, metadata: dict | None) -> tuple[list[dict], dict]:
    records, extracted_metadata = process_pdf_to_records(pdf_bytes, manual_metadata=metadata)
    job["frbr_uri"] = extracted_metadata.get("frbr_uri", "/akn/id/act/unknown")

    job["message"] = f"Menghasilkan embedding untuk {len(records)} pasal (ini bisa memakan waktu)..."
    embeddings = generate_embeddings([r["isi_teks"] for r in records])

    rows = [{**rec, "embedding": emb} for rec, emb in zip(records, embeddings)]
    return rows, extracted_metadata


def _clear_or_reject_existing(db: Client, job: dict, replace_uri: str | None) -> None:
    if replace_uri:
        job["message"] = f"Menghapus dokumen lama ({replace_uri})..."
        legal_document_repository.delete_by_uri(db, replace_uri)
        log.info(f"[ADMIN_DOCS] Deleted old document: {replace_uri}")
        return

    frbr_uri = job["frbr_uri"]
    if legal_document_repository.count_by_uri(db, frbr_uri) > 0:
        raise DocumentAlreadyExists(
            f"Dokumen dengan URI '{frbr_uri}' sudah ada di database. Gunakan fitur Replace jika ingin mengganti."
        )


def _insert_in_batches(db: Client, job: dict, rows: list[dict]) -> int:
    job["message"] = f"Menyimpan {len(rows)} pasal ke database..."
    for i in range(0, len(rows), INSERT_BATCH_SIZE):
        legal_document_repository.insert_many(db, rows[i : i + INSERT_BATCH_SIZE])
    return len(rows)


def process_pdf_job(job_id: str, pdf_bytes: bytes, metadata: dict | None = None, replace_uri: str | None = None):
    job = _jobs[job_id]
    job["status"] = "processing"
    job["message"] = "Memproses PDF..."

    try:
        rows, extracted_metadata = _build_rows(job, pdf_bytes, metadata)
        db = get_supabase_client()
        _clear_or_reject_existing(db, job, replace_uri)
        total_inserted = _insert_in_batches(db, job, rows)

        job["status"] = "completed"
        job["total_chunks"] = total_inserted
        job["message"] = f"Berhasil! {total_inserted} pasal dari '{extracted_metadata.get('nama_uu', 'Dokumen')}' telah disimpan."
        log.info(f"[ADMIN_DOCS] Job {job_id} completed: {total_inserted} chunks inserted for {job['frbr_uri']}")

    except DocumentAlreadyExists as e:
        _mark_failed(job, str(e), "Gagal: dokumen sudah ada.")
    except Exception as e:
        _mark_failed(job, str(e), f"Gagal memproses PDF: {str(e)[:200]}")
        log.error(f"[ADMIN_DOCS] Job {job_id} failed: {e}", exc_info=True)


def _require_pdf_filename(file: UploadFile) -> None:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise BadRequestError("File harus berformat PDF.")


async def _read_pdf_bytes(file: UploadFile, max_bytes: int | None = None) -> bytes:
    pdf_bytes = await file.read()
    if len(pdf_bytes) < MIN_PDF_BYTES:
        raise BadRequestError("File PDF terlalu kecil atau kosong.")
    if max_bytes is not None and len(pdf_bytes) > max_bytes:
        raise BadRequestError("File PDF terlalu besar (maks 50MB).")
    return pdf_bytes


async def create_upload_job(user: dict, form: DocumentUploadForm) -> tuple[dict, bytes, dict]:
    _require_admin(user)
    _require_pdf_filename(form.file)

    pdf_bytes = await _read_pdf_bytes(form.file, max_bytes=MAX_PDF_BYTES)
    manual_metadata = _build_manual_metadata(form, default_frbr_uri=None)

    job = _register_job(f"File '{form.file.filename}' diterima. Menunggu proses...")
    log.info(f"[ADMIN_DOCS] Job {job['job_id']} queued for '{form.file.filename}' ({len(pdf_bytes):,} bytes) with manual metadata.")

    return job, pdf_bytes, manual_metadata


async def create_replace_job(
    db: Client, user: dict, form: DocumentReplaceForm
) -> tuple[dict, bytes, dict]:
    _require_admin(user)
    _require_pdf_filename(form.file)

    frbr_uri = form.frbr_uri
    if not legal_document_repository.count_by_uri(db, frbr_uri):
        raise NotFoundError(f"Dokumen dengan URI '{frbr_uri}' tidak ditemukan.")

    pdf_bytes = await _read_pdf_bytes(form.file)
    manual_metadata = _build_manual_metadata(form, default_frbr_uri=frbr_uri)

    job = _register_job(
        f"Akan mengganti dokumen '{frbr_uri}' dengan file baru '{form.file.filename}'...",
        frbr_uri=frbr_uri,
    )
    log.info(f"[ADMIN_DOCS] Replace job {job['job_id']} queued for {frbr_uri}")

    return job, pdf_bytes, manual_metadata


def get_job_status(user: dict, job_id: str) -> dict:
    _require_admin(user)

    job = _jobs.get(job_id)
    if not job:
        raise NotFoundError("Job tidak ditemukan.")
    return job


def list_documents(
    db: Client,
    user: dict,
    page: int,
    page_size: int,
    kategori: Optional[str],
    search: Optional[str],
) -> PaginatedResponse:
    _require_admin(user)

    offset = (page - 1) * page_size
    rows, total = legal_document_repository.list_summaries(
        db, offset, page_size, kategori=kategori, search=search
    )

    return PaginatedResponse(data=rows, total=total, page=page, page_size=page_size)


def list_chunks(
    db: Client,
    user: dict,
    frbr_uri: str,
    page: int,
    page_size: int,
    search: Optional[str],
) -> PaginatedResponse:
    _require_admin(user)

    total = legal_document_repository.count_by_uri(db, frbr_uri, search)

    offset = (page - 1) * page_size
    rows = legal_document_repository.list_by_uri(
        db, frbr_uri, SELECT_COLS, offset, page_size, search
    )

    return PaginatedResponse(data=rows, total=total, page=page, page_size=page_size)


def get_chunk(db: Client, user: dict, id_dokumen: int) -> dict:
    _require_admin(user)

    chunk = legal_document_repository.get_by_id(db, id_dokumen, SELECT_COLS)

    if chunk is None:
        raise NotFoundError("Chunk tidak ditemukan.")
    return chunk


def update_chunk(db: Client, user: dict, id_dokumen: int, payload: UpdateChunkRequest) -> dict:
    _require_admin(user)

    if legal_document_repository.get_by_id(db, id_dokumen, "id_dokumen") is None:
        raise NotFoundError("Chunk tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise BadRequestError("Tidak ada field yang diubah.")

    if "kategori" in update_data and update_data["kategori"] is not None:
        update_data["kategori"] = update_data["kategori"].value

    if "isi_teks" in update_data:
        update_data["embedding"] = _embed_single(update_data["isi_teks"])
        log.info(f"[ADMIN_DOCS] Re-embedding chunk {id_dokumen}")

    update_data["updated_at"] = datetime.now().isoformat()

    updated = legal_document_repository.update(db, id_dokumen, update_data)

    if not updated:
        raise InternalError("Gagal update chunk.")

    log.info(f"[ADMIN_DOCS] Updated chunk {id_dokumen}")
    return updated[0]


def delete_document(db: Client, user: dict, frbr_uri: str) -> None:
    _require_admin(user)

    total = legal_document_repository.count_by_uri(db, frbr_uri)
    if not total:
        raise NotFoundError("Dokumen dengan URI tersebut tidak ditemukan.")

    legal_document_repository.delete_by_uri(db, frbr_uri)
    log.info(f"[ADMIN_DOCS] Deleted all chunks for {frbr_uri} ({total} rows)")
