from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user
from services import case_service
from typing import Optional

router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Client posting kasus anonim ke bursa (dengan file upload)",
    description="""
Membuat kasus baru pada bursa kasus.

Khusus role client. Kasus yang berhasil diposting akan berstatus `open`
dan dapat diklaim langsung oleh konsultan.

Mendukung upload file dokumen pendukung (opsional).
Gunakan field `dokumen_pendukung_files` untuk upload file (bisa lebih dari satu).
Format yang diizinkan: PDF / JPG / JPEG / PNG / WEBP.
""",
)
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


@router.get(
    "/",
    summary="Konsultan melihat daftar bursa kasus open",
    description="Khusus role konsultan. Mengambil semua kasus bursa dengan status `open`.",
)
def lihat_bursa_kasus(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    (Khusus Konsultan) Endpoint untuk melihat semua kasus yang masih 'open'.
    """
    return case_service.list_open_cases(db, current_user)


@router.post(
    "/{id_bursa}/claim",
    status_code=status.HTTP_201_CREATED,
    summary="Konsultan klaim langsung sebuah kasus dari bursa",
    description="""
Khusus role konsultan. Konsultan langsung mengambil/mengklaim kasus dari bursa.

Saat klaim berhasil:
- Status bursa berubah menjadi `closed`.
- Otomatis dibuatkan draf pengajuan konsultasi (tabel `pengajuan_konsultasi`).
""",
)
def klaim_kasus(
    id_bursa: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return case_service.claim_case(db, current_user, id_bursa)
