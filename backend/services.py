import httpx
from fastapi import UploadFile, HTTPException
from config import get_settings
from uuid import uuid4


MAX_PORTFOLIO_SIZE_MB = 10
MAX_SUPPORTING_DOC_SIZE_MB = 10


async def upload_to_imgbb(file: UploadFile, api_key: str) -> str:
    allowed_extensions = {"jpg", "jpeg", "png", "gif", "webp"}
    file_extension = file.filename.split(".")[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Format file tidak didukung. Gunakan: {', '.join(allowed_extensions)}"
        )
    
    file_size = len(await file.read())
    await file.seek(0) 
    
    max_size_mb = 5
    if file_size > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Ukuran file terlalu besar (maksimal {max_size_mb}MB)"
        )

    files = {"image": (file.filename, await file.read())}
    data = {"key": api_key}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.imgbb.com/1/upload",
                data=data,
                files=files,
                timeout=10.0
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail="Gagal mengunggah foto ke ImgBB"
            )
        
        response_data = response.json()
        if not response_data.get("success"):
            raise HTTPException(
                status_code=500,
                detail=response_data.get("error", {}).get("message", "Upload gagal")
            )
        
        image_url = response_data["data"]["url"]
        return image_url
        
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=500,
            detail="Koneksi ke ImgBB timeout"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saat upload: {str(e)}"
        )


async def update_user_profile_photo(
    user_id: int, 
    file: UploadFile, 
    db_client
) -> dict:
    settings = get_settings()
    if not settings.imgbb_api_key:
        raise HTTPException(
            status_code=500,
            detail="Konfigurasi IMGBB_API_KEY belum diatur",
        )
    
    photo_url = await upload_to_imgbb(file, settings.imgbb_api_key)
    
    updated_user = db_client.table("users").update({
        "foto_profil": photo_url
    }).eq("id_user", user_id).execute()
    
    if not updated_user.data:
        raise HTTPException(
            status_code=500,
            detail="Gagal menyimpan foto ke database"
        )
    
    return {
        "message": "Foto profil berhasil diperbarui",
        "foto_profil_url": photo_url,
        "data": updated_user.data[0]
    }


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

    # Validasi sederhana header PDF
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
