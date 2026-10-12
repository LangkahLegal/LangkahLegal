from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user
from services import case_service
from typing import Optional
from docs import cases as docs

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, **docs.POSTING_KASUS_ANONIM)
async def posting_kasus_anonim(
    kategori_hukum: str = Form(...),
    deskripsi_kasus_awam: str = Form(...),
    tanggal_konsultasi: str = Form(...),
    jam_mulai: str = Form(...),
    jam_selesai: str = Form(...),
    dokumen_bukti: Optional[str] = Form(default=None),
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return await case_service.post_case(
        db=db,
        current_user=current_user,
        kategori_hukum=kategori_hukum,
        deskripsi_kasus_awam=deskripsi_kasus_awam,
        tanggal_konsultasi=tanggal_konsultasi,
        jam_mulai=jam_mulai,
        jam_selesai=jam_selesai,
        dokumen_bukti=dokumen_bukti,
        dokumen_pendukung_files=dokumen_pendukung_files,
    )


@router.get("/", **docs.LIHAT_BURSA_KASUS)
def lihat_bursa_kasus(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return case_service.list_open_cases(db, current_user)


@router.post("/{id_bursa}/claim", status_code=status.HTTP_201_CREATED, **docs.KLAIM_KASUS)
def klaim_kasus(
    id_bursa: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return case_service.claim_case(db, current_user, id_bursa)
