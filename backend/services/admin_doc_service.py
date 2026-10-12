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
from schemas.admin_docs import PaginatedResponse, UpdateChunkRequest
from helpers.access import require_role
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


def _build_manual_metadata(
    nama_uu: str,
    nomor_uu: str | None,
    tahun_uu: int | None,
    kategori: str,
    status_hukum: str,
    frbr_uri: str | None,
) -> dict:
    return {
        "nama_uu": nama_uu,
        "nomor_uu": f"UU No. {nomor_uu} Tahun {tahun_uu}" if nomor_uu and tahun_uu else None,
        "tahun_uu": tahun_uu,
        "kategori": kategori,
        "status_hukum": status_hukum,
        "frbr_uri": frbr_uri
    }


def process_pdf_job(job_id: str, pdf_bytes: bytes, metadata: dict | None = None, replace_uri: str | None = None):
    job = _jobs[job_id]
    job["status"] = "processing"
    job["message"] = "Memproses PDF..."

    try:
        records, extracted_metadata = process_pdf_to_records(pdf_bytes, manual_metadata=metadata)
        frbr_uri = extracted_metadata.get("frbr_uri", "/akn/id/act/unknown")
        job["frbr_uri"] = frbr_uri

        job["message"] = f"Menghasilkan embedding untuk {len(records)} pasal (ini bisa memakan waktu)..."
        texts = [r["isi_teks"] for r in records]
        embeddings = generate_embeddings(texts)

        rows = [{**rec, "embedding": emb} for rec, emb in zip(records, embeddings)]

        db = get_supabase_client()

        if replace_uri:
            job["message"] = f"Menghapus dokumen lama ({replace_uri})..."
            db.table("dokumen_hukum").delete().eq("frbr_uri", replace_uri).execute()
            log.info(f"[ADMIN_DOCS] Deleted old document: {replace_uri}")

        if not replace_uri:
            existing = (
                db.table("dokumen_hukum")
                .select("id_dokumen", count="exact")
                .eq("frbr_uri", frbr_uri)
                .execute()
            )
            if existing.count and existing.count > 0:
                job["status"] = "failed"
                job["error"] = f"Dokumen dengan URI '{frbr_uri}' sudah ada di database. Gunakan fitur Replace jika ingin mengganti."
                job["message"] = "Gagal: dokumen sudah ada."
                return

        job["message"] = f"Menyimpan {len(rows)} pasal ke database..."
        batch_size = 40
        total_inserted = 0
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            db.table("dokumen_hukum").insert(batch).execute()
            total_inserted += len(batch)

        job["status"] = "completed"
        job["total_chunks"] = total_inserted
        job["message"] = f"Berhasil! {total_inserted} pasal dari '{extracted_metadata.get('nama_uu', 'Dokumen')}' telah disimpan."
        log.info(f"[ADMIN_DOCS] Job {job_id} completed: {total_inserted} chunks inserted for {frbr_uri}")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["message"] = f"Gagal memproses PDF: {str(e)[:200]}"
        log.error(f"[ADMIN_DOCS] Job {job_id} failed: {e}", exc_info=True)


async def create_upload_job(
    user: dict,
    file: UploadFile,
    nama_uu: str,
    nomor_uu: str | None,
    tahun_uu: int | None,
    kategori: str,
    status_hukum: str,
) -> tuple[dict, bytes, dict]:
    _require_admin(user)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise BadRequestError("File harus berformat PDF.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) < 100:
        raise BadRequestError("File PDF terlalu kecil atau kosong.")
    if len(pdf_bytes) > 50 * 1024 * 1024:
        raise BadRequestError("File PDF terlalu besar (maks 50MB).")

    frbr_uri = _build_frbr_uri(nomor_uu, tahun_uu, default=None)
    manual_metadata = _build_manual_metadata(
        nama_uu, nomor_uu, tahun_uu, kategori, status_hukum, frbr_uri
    )

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "message": f"File '{file.filename}' diterima. Menunggu proses...",
        "frbr_uri": None,
        "total_chunks": None,
        "error": None,
    }

    log.info(f"[ADMIN_DOCS] Job {job_id} queued for '{file.filename}' ({len(pdf_bytes):,} bytes) with manual metadata.")

    return _jobs[job_id], pdf_bytes, manual_metadata


async def create_replace_job(
    db: Client,
    user: dict,
    file: UploadFile,
    frbr_uri: str,
    nama_uu: str,
    nomor_uu: str | None,
    tahun_uu: int | None,
    kategori: str,
    status_hukum: str,
) -> tuple[dict, bytes, dict]:
    _require_admin(user)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise BadRequestError("File harus berformat PDF.")

    existing = (
        db.table("dokumen_hukum")
        .select("id_dokumen", count="exact")
        .eq("frbr_uri", frbr_uri)
        .execute()
    )
    if not (existing.count or 0):
        raise NotFoundError(f"Dokumen dengan URI '{frbr_uri}' tidak ditemukan.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) < 100:
        raise BadRequestError("File PDF terlalu kecil atau kosong.")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "message": f"Akan mengganti dokumen '{frbr_uri}' dengan file baru '{file.filename}'...",
        "frbr_uri": frbr_uri,
        "total_chunks": None,
        "error": None,
    }

    new_frbr_uri = _build_frbr_uri(nomor_uu, tahun_uu, default=frbr_uri)
    manual_metadata = _build_manual_metadata(
        nama_uu, nomor_uu, tahun_uu, kategori, status_hukum, new_frbr_uri
    )

    log.info(f"[ADMIN_DOCS] Replace job {job_id} queued for {frbr_uri}")

    return _jobs[job_id], pdf_bytes, manual_metadata


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

    query = db.table("dokumen_hukum_summary").select(
        "frbr_uri, nama_uu, nomor_uu, tahun_uu, kategori, status_hukum, total_chunks", count="exact"
    )

    if kategori:
        query = query.eq("kategori", kategori)
    if search:
        query = query.ilike("nama_uu", f"%{search}%")

    offset = (page - 1) * page_size
    result = query.order("frbr_uri").range(offset, offset + page_size - 1).execute()

    rows = result.data or []
    total = result.count or 0

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

    count_query = db.table("dokumen_hukum").select("id_dokumen", count="exact").eq("frbr_uri", frbr_uri)
    data_query = db.table("dokumen_hukum").select(SELECT_COLS).eq("frbr_uri", frbr_uri)

    if search:
        search_filter = f"pasal_bagian.ilike.%{search}%,isi_teks.ilike.%{search}%"
        count_query = count_query.or_(search_filter)
        data_query = data_query.or_(search_filter)

    count_result = count_query.execute()
    total = count_result.count or 0

    offset = (page - 1) * page_size
    result = (
        data_query
        .order("id_dokumen")
        .range(offset, offset + page_size - 1)
        .execute()
    )

    return PaginatedResponse(
        data=result.data or [], total=total, page=page, page_size=page_size
    )


def get_chunk(db: Client, user: dict, id_dokumen: int) -> dict:
    _require_admin(user)

    result = (
        db.table("dokumen_hukum")
        .select(SELECT_COLS)
        .eq("id_dokumen", id_dokumen)
        .execute()
    )

    if not result.data:
        raise NotFoundError("Chunk tidak ditemukan.")
    return result.data[0]


def update_chunk(db: Client, user: dict, id_dokumen: int, payload: UpdateChunkRequest) -> dict:
    _require_admin(user)

    existing = (
        db.table("dokumen_hukum")
        .select("id_dokumen")
        .eq("id_dokumen", id_dokumen)
        .execute()
    )
    if not existing.data:
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

    result = (
        db.table("dokumen_hukum")
        .update(update_data)
        .eq("id_dokumen", id_dokumen)
        .execute()
    )

    if not result.data:
        raise InternalError("Gagal update chunk.")

    log.info(f"[ADMIN_DOCS] Updated chunk {id_dokumen}")
    return result.data[0]


def delete_document(db: Client, user: dict, frbr_uri: str) -> None:
    _require_admin(user)

    existing = (
        db.table("dokumen_hukum")
        .select("id_dokumen", count="exact")
        .eq("frbr_uri", frbr_uri)
        .execute()
    )
    if not (existing.count or 0):
        raise NotFoundError("Dokumen dengan URI tersebut tidak ditemukan.")

    db.table("dokumen_hukum").delete().eq("frbr_uri", frbr_uri).execute()
    log.info(f"[ADMIN_DOCS] Deleted all chunks for {frbr_uri} ({existing.count} rows)")
