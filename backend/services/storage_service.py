from fastapi import UploadFile, HTTPException
from uuid import uuid4


MAX_PORTFOLIO_SIZE_MB = 10
MAX_SUPPORTING_DOC_SIZE_MB = 10


async def upload_portfolio_pdf_to_supabase(
    file: UploadFile,
    user_id: int,
    db_client,
    bucket_name: str,
) -> str:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="File portofolio tidak ditemukan")

    filename = file.filename.lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Portofolio wajib berformat PDF")

    if file.content_type and file.content_type.lower() not in {
        "application/pdf",
        "application/x-pdf",
    }:
        raise HTTPException(status_code=400, detail="Content-Type file harus application/pdf")

    await file.seek(0)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="File portofolio kosong")

    max_size_bytes = MAX_PORTFOLIO_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Ukuran file portofolio melebihi {MAX_PORTFOLIO_SIZE_MB}MB",
        )

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File tidak valid sebagai PDF")

    storage_path = f"konsultan/{user_id}/{uuid4().hex}.pdf"

    try:
        storage = db_client.storage.from_(bucket_name)
        storage.upload(
            storage_path,
            file_bytes,
            {
                "content-type": "application/pdf",
                "upsert": "true",
            },
        )
        public_url = storage.get_public_url(storage_path)
        return public_url
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal upload portofolio ke Supabase Storage: {str(exc)}",
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

    allowed_ext = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif"}
    matched_ext = next((ext for ext in allowed_ext if lowered.endswith(ext)), None)
    if not matched_ext:
        raise HTTPException(status_code=400, detail="Dokumen pendukung hanya boleh PDF atau image")

    await file.seek(0)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="File dokumen pendukung kosong")

    max_size_bytes = MAX_SUPPORTING_DOC_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Ukuran dokumen pendukung melebihi {MAX_SUPPORTING_DOC_SIZE_MB}MB",
        )

    is_pdf = matched_ext == ".pdf"
    if is_pdf and not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File PDF dokumen pendukung tidak valid")

    tipe_file = "pdf" if is_pdf else "image"
    storage_ext = matched_ext.lstrip(".")
    storage_path = f"pengajuan/{id_pengajuan}/user_{id_user}/{uuid4().hex}.{storage_ext}"

    if is_pdf:
        content_type = "application/pdf"
    else:
        content_type = file.content_type or f"image/{storage_ext if storage_ext != 'jpg' else 'jpeg'}"

    try:
        storage = db_client.storage.from_(bucket_name)
        storage.upload(
            storage_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "false",
            },
        )
        public_url = storage.get_public_url(storage_path)
        ukuran_kb = max(1, len(file_bytes) // 1024)
        return {
            "nama_dokumen": filename,
            "file_url": public_url,
            "tipe_file": tipe_file,
            "ukuran_kb": ukuran_kb,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal upload dokumen pendukung: {str(exc)}",
        )


def remove_file_from_supabase(db_client, bucket_name: str, storage_path: str) -> None:
    db_client.storage.from_(bucket_name).remove([storage_path])
