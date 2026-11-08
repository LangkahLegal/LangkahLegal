import logging
from typing import Callable, Optional
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from core.config import get_settings
from core.exceptions import BadRequestError

logger = logging.getLogger(__name__)

MAX_PORTFOLIO_SIZE_MB = 10
MAX_SUPPORTING_DOC_SIZE_MB = 10
MAX_AVATAR_SIZE_MB = 2
MAX_FILES_PER_UPLOAD = 10

# Masa berlaku signed URL untuk file privat (dokumen kasus): 1 jam.
SIGNED_URL_TTL_SECONDS = 3600

SUPPORTING_DOC_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif"}
AVATAR_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


async def _read_file_bytes(file: UploadFile, label: str, max_size_mb: int, size_label: str) -> bytes:
    await file.seek(0)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail=f"File {label} kosong")

    if len(file_bytes) > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Ukuran {size_label} melebihi {max_size_mb}MB",
        )
    return file_bytes


def _put_object(
    db_client,
    bucket_name: str,
    storage_path: str,
    file_bytes: bytes,
    content_type: str,
    upsert: bool,
    error_prefix: str,
) -> None:
    try:
        db_client.storage.from_(bucket_name).upload(
            storage_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "true" if upsert else "false",
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{error_prefix}: {str(exc)}")


def _upload_to_bucket(
    db_client,
    bucket_name: str,
    storage_path: str,
    file_bytes: bytes,
    content_type: str,
    upsert: bool,
    error_prefix: str,
) -> str:
    """Upload lalu kembalikan URL publik. Hanya untuk bucket publik (avatar, portofolio)."""
    _put_object(db_client, bucket_name, storage_path, file_bytes, content_type, upsert, error_prefix)
    return db_client.storage.from_(bucket_name).get_public_url(storage_path)


def _upload_to_bucket_private(
    db_client,
    bucket_name: str,
    storage_path: str,
    file_bytes: bytes,
    content_type: str,
    upsert: bool,
    error_prefix: str,
) -> str:
    """Upload lalu kembalikan storage path (bukan URL). Untuk bucket privat (dokumen kasus)."""
    _put_object(db_client, bucket_name, storage_path, file_bytes, content_type, upsert, error_prefix)
    return storage_path


def create_signed_url(db_client, bucket_name: str, storage_path: str, expires_in: int = SIGNED_URL_TTL_SECONDS) -> str | None:
    """Buat signed URL untuk satu storage path. None kalau gagal/kosong."""
    if not storage_path:
        return None
    try:
        res = db_client.storage.from_(bucket_name).create_signed_url(storage_path, expires_in)
        if isinstance(res, dict):
            return res.get("signedURL") or res.get("signedUrl") or res.get("signed_url")
        return res
    except Exception as exc:
        logger.warning(f"Gagal membuat signed URL untuk {bucket_name}/{storage_path}: {exc}")
        return None


def path_from_ref(bucket_name: str, value: str | None) -> str | None:
    """Ambil storage path dari nilai tersimpan: URL publik lama -> path; path apa adanya; link eksternal -> None."""
    if not value:
        return None
    public_marker = f"/storage/v1/object/public/{bucket_name}/"
    sign_marker = f"/storage/v1/object/sign/{bucket_name}/"
    for marker in (public_marker, sign_marker):
        if marker in value:
            return value.split(marker, 1)[1].split("?", 1)[0]
    if value.startswith("http://") or value.startswith("https://"):
        return None  # link eksternal milik user, bukan file kita
    return value  # sudah berupa storage path


def sign_stored_ref(db_client, bucket_name: str, value: str | None, expires_in: int = SIGNED_URL_TTL_SECONDS) -> str | None:
    """Ubah nilai tersimpan menjadi URL siap pakai: file kita -> signed URL; link eksternal -> apa adanya.

    Toleran terhadap data lama (URL publik penuh) maupun data baru (storage path).
    """
    path = path_from_ref(bucket_name, value)
    if path is None:
        return value  # link eksternal atau kosong: biarkan
    return create_signed_url(db_client, bucket_name, path, expires_in) or value


async def upload_portfolio_pdf_to_supabase(
    file: UploadFile,
    user_id: int,
    db_client,
    bucket_name: str,
) -> str:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="File portofolio tidak ditemukan")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Portofolio wajib berformat PDF")

    if file.content_type and file.content_type.lower() not in PDF_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Content-Type file harus application/pdf")

    file_bytes = await _read_file_bytes(file, "portofolio", MAX_PORTFOLIO_SIZE_MB, "file portofolio")

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File tidak valid sebagai PDF")

    return _upload_to_bucket(
        db_client,
        bucket_name,
        f"konsultan/{user_id}/{uuid4().hex}.pdf",
        file_bytes,
        content_type="application/pdf",
        upsert=True,
        error_prefix="Gagal upload portofolio ke Supabase Storage",
    )


async def upload_avatar_to_supabase(
    file: UploadFile,
    user_id: int,
    db_client,
    bucket_name: str,
) -> str:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="File foto profil tidak ditemukan")

    lowered = file.filename.lower()
    matched_ext = next((ext for ext in AVATAR_EXTENSIONS if lowered.endswith(ext)), None)
    if not matched_ext:
        raise HTTPException(status_code=400, detail="Foto profil harus berformat PNG, JPG, WEBP, atau GIF")

    if file.content_type and not file.content_type.lower().startswith("image/"):
        raise HTTPException(status_code=400, detail="Content-Type file harus image")

    file_bytes = await _read_file_bytes(file, "foto profil", MAX_AVATAR_SIZE_MB, "foto profil")

    storage_ext = matched_ext.lstrip(".")
    content_type = file.content_type or f"image/{'jpeg' if storage_ext == 'jpg' else storage_ext}"

    return _upload_to_bucket(
        db_client,
        bucket_name,
        f"user_{user_id}/{uuid4().hex}.{storage_ext}",
        file_bytes,
        content_type=content_type,
        upsert=True,
        error_prefix="Gagal upload foto profil ke Supabase Storage",
    )


async def upload_supporting_document_to_supabase(
    file: UploadFile,
    id_pengajuan: int,
    id_user: int,
    db_client,
    bucket_name: str,
) -> dict:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="File dokumen pendukung tidak ditemukan")

    filename = file.filename
    lowered = filename.lower()

    matched_ext = next((ext for ext in SUPPORTING_DOC_EXTENSIONS if lowered.endswith(ext)), None)
    if not matched_ext:
        raise HTTPException(status_code=400, detail="Dokumen pendukung hanya boleh PDF atau image")

    file_bytes = await _read_file_bytes(file, "dokumen pendukung", MAX_SUPPORTING_DOC_SIZE_MB, "dokumen pendukung")

    is_pdf = matched_ext == ".pdf"
    if is_pdf and not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File PDF dokumen pendukung tidak valid")

    storage_ext = matched_ext.lstrip(".")
    if is_pdf:
        content_type = "application/pdf"
    else:
        content_type = file.content_type or f"image/{storage_ext if storage_ext != 'jpg' else 'jpeg'}"

    storage_path = _upload_to_bucket_private(
        db_client,
        bucket_name,
        f"pengajuan/{id_pengajuan}/user_{id_user}/{uuid4().hex}.{storage_ext}",
        file_bytes,
        content_type=content_type,
        upsert=False,
        error_prefix="Gagal upload dokumen pendukung",
    )

    return {
        "nama_dokumen": filename,
        "file_path": storage_path,
        "tipe_file": "pdf" if is_pdf else "image",
        "ukuran_kb": max(1, len(file_bytes) // 1024),
    }


def select_valid_files(
    files: Optional[list[UploadFile]],
    too_many_detail: str,
    empty_detail: Optional[str] = None,
) -> list[UploadFile]:
    valid_files = [f for f in (files or []) if f.filename]

    if not valid_files and empty_detail:
        raise BadRequestError(empty_detail)
    if len(valid_files) > MAX_FILES_PER_UPLOAD:
        raise BadRequestError(too_many_detail)

    return valid_files


async def upload_supporting_documents(
    db_client,
    files: list[UploadFile],
    id_pengajuan: int,
    id_user: int,
    on_uploaded: Callable[[dict], object],
    detail_only: bool = False,
) -> tuple[list, list[dict]]:
    bucket_name = get_settings().supabase_berkas_pendukung_bucket
    uploaded = []
    failed = []

    for file in files:
        try:
            doc_meta = await upload_supporting_document_to_supabase(
                file=file,
                id_pengajuan=id_pengajuan,
                id_user=id_user,
                db_client=db_client,
                bucket_name=bucket_name,
            )
            uploaded.append(on_uploaded(doc_meta))
        except HTTPException as e:
            failed.append({"nama": file.filename, "alasan": e.detail if detail_only else str(e)})
        except Exception as e:
            failed.append({"nama": file.filename, "alasan": str(e)})

    return uploaded, failed


def remove_file_from_supabase(db_client, bucket_name: str, storage_path: str) -> None:
    db_client.storage.from_(bucket_name).remove([storage_path])
