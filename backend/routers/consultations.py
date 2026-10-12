from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from supabase import Client
from database import get_supabase_client
from schemas.consultations import AssignSchedule, RatingCreate
from dependencies import get_current_user
from services import consultation_service

router = APIRouter()

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Buat pengajuan konsultasi + upload dokumen pendukung",
    description="""
Membuat pengajuan konsultasi baru (khusus role client).

Mendukung 2 format request:
1. `application/json` untuk pengajuan tanpa file.
2. `multipart/form-data` untuk pengajuan dengan file dokumen pendukung.

Field wajib:
- `id_jadwal`: ID slot jadwal yang dipilih client.
- `deskripsi_kasus`: Ringkasan masalah hukum.
- `jam_mulai`: ISO 8601 timestamp, contoh `2026-04-13T09:00:00+07:00`.
- `jam_selesai`: ISO 8601 timestamp, harus lebih besar dari jam_mulai.

Upload dokumen:
- Gunakan field file `dokumen_pendukung_files` (bisa lebih dari satu file).
- Format yang diizinkan: PDF / JPG / JPEG / PNG / WEBP / GIF.
- File disimpan ke Supabase bucket `berkas-pendukung`, metadata tersimpan di tabel `dokumen_pendukung`.
""",
    response_description="ID pengajuan, status pengajuan, dan list metadata dokumen pendukung yang berhasil disimpan.",
)
async def buat_pengajuan_konsultasi(
    id_jadwal: int = Form(...),
    deskripsi_kasus: str = Form(...),
    jam_mulai: str = Form(...),
    jam_selesai: str = Form(...),
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    return await consultation_service.create_consultation(
        db=db,
        current_user=current_user,
        id_jadwal=id_jadwal,
        deskripsi_kasus=deskripsi_kasus,
        jam_mulai=jam_mulai,
        jam_selesai=jam_selesai,
        dokumen_pendukung_files=dokumen_pendukung_files,
    )

@router.put("/{id_pengajuan}/status")
def update_consultation_status(
    id_pengajuan: int,
    new_status: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    return consultation_service.update_status(db, current_user, id_pengajuan, new_status)

@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Ambil daftar konsultasi milik user login",
    description="""
Mengembalikan daftar pengajuan konsultasi berdasarkan role user:
- Client: hanya pengajuan milik dirinya.
- Konsultan: hanya pengajuan yang ditujukan ke dirinya.

Response sudah termasuk relasi:
- jadwal_ketersediaan
- profil singkat konsultan
- dokumen_pendukung (one-to-many)
""",
)
def get_my_consultations(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    return consultation_service.list_my_consultations(db, current_user)

@router.get(
    "/{id_pengajuan}",
    status_code=status.HTTP_200_OK,
    summary="Ambil detail satu pengajuan konsultasi",
    description="""
Mengambil detail lengkap pengajuan konsultasi berdasarkan `id_pengajuan`.

Akses dibatasi:
- Client hanya boleh melihat pengajuan miliknya.
- Konsultan hanya boleh melihat pengajuan yang terkait dengan profil konsultannya.

Response mencakup data relasi jadwal, user, dan daftar dokumen_pendukung.
""",
)
def get_detail_pengajuan(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    return consultation_service.get_consultation_detail(db, current_user, id_pengajuan)


@router.put(
    "/{id_pengajuan}/assign-schedule",
    summary="Konsultan atur jadwal untuk klaim bursa",
    description="""
Khusus konsultan. Digunakan setelah konsultan mengklaim kasus dari bursa.
Konsultan memilih slot jadwal miliknya, lalu sistem:
- Mengisi tanggal_pengajuan, jam_mulai, jam_selesai, id_jadwal pada pengajuan.
- Mengubah status menjadi `menunggu_pembayaran`.
""",
)
def assign_schedule_to_claim(
    id_pengajuan: int,
    request: AssignSchedule,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.assign_schedule(db, current_user, id_pengajuan, request)


@router.put(
    "/{id_pengajuan}/zoom-link",
    summary="Konsultan mengatur link Zoom untuk konsultasi",
    description="""
Khusus konsultan. Digunakan untuk mengisi atau mengubah link Zoom meeting
untuk sesi konsultasi yang sudah terjadwal.
""",
)
def update_zoom_link(
    id_pengajuan: int,
    link_zoom: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.update_zoom_link(db, current_user, id_pengajuan, link_zoom)


@router.put(
    "/{id_pengajuan}/complete",
    summary="Klien menandai konsultasi telah selesai",
    description="""
Khusus role client.
Digunakan setelah sesi konsultasi (Zoom) selesai untuk mengubah status dari `terjadwal` menjadi `selesai`.
""",
)
def tandai_konsultasi_selesai(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    return consultation_service.mark_completed(db, current_user, id_pengajuan)



@router.get("/{id_konsultan}/booked-slots", status_code=status.HTTP_200_OK)
def get_booked_slots(
    id_konsultan: int,
    db: Client = Depends(get_supabase_client)
):
    """
    Mengambil daftar jam yang sudah terisi (booked) untuk konsultan tertentu.
    Digunakan oleh frontend untuk menonaktifkan pilihan jam di Schedule Picker.
    """
    return consultation_service.get_booked_slots(db, id_konsultan)


@router.get(
    "/{id_pengajuan}/documents",
    status_code=status.HTTP_200_OK,
    summary="Lihat daftar dokumen pendukung",
    description="""
Mengambil semua dokumen pendukung yang terkait dengan pengajuan konsultasi tertentu.
Akses dibatasi: hanya pemilik pengajuan (client) atau konsultan terkait yang bisa melihat.
""",
)
def get_documents(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.list_documents(db, current_user, id_pengajuan)


@router.post(
    "/{id_pengajuan}/documents",
    status_code=status.HTTP_201_CREATED,
    summary="Upload dokumen pendukung tambahan",
    description="""
Upload file dokumen pendukung tambahan untuk pengajuan yang sudah ada.
Hanya pemilik pengajuan (client) yang boleh menambahkan dokumen.
Format: PDF / JPG / JPEG / PNG / WEBP / GIF. Maks 10MB per file.
""",
)
async def upload_document(
    id_pengajuan: int,
    dokumen_pendukung_files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return await consultation_service.upload_documents(
        db, current_user, id_pengajuan, dokumen_pendukung_files
    )


@router.delete(
    "/{id_pengajuan}/documents/{id_dokumen}",
    status_code=status.HTTP_200_OK,
    summary="Hapus dokumen pendukung",
    description="""
Menghapus satu dokumen pendukung berdasarkan `id_dokumen`.
Hanya pemilik pengajuan (client) yang boleh menghapus dokumen miliknya.
File juga akan dihapus dari Supabase Storage.
""",
)
def delete_document(
    id_pengajuan: int,
    id_dokumen: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.delete_document(db, current_user, id_pengajuan, id_dokumen)

@router.post(
    "/{id_pengajuan}/rating",
    summary="Berikan rating dan ulasan untuk konsultasi yang sudah selesai",
    description="Khusus klien. Digunakan untuk memberi rating dan menandai konsultasi telah selesai.",
)
def submit_rating(
    id_pengajuan: int,
    rating_data: RatingCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.submit_rating(db, current_user, id_pengajuan, rating_data)
