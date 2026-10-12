from fastapi import APIRouter, Depends, status
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user

from schemas.consultants import (
    ScheduleCreate,
    ScheduleToggle,
    ConsultantActiveToggle,
    ScheduleUpdate,
)
from services import consultant_service
from typing import Optional

router = APIRouter()


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Ambil katalog konsultan aktif",
    description="""
Mengambil daftar konsultan aktif untuk halaman katalog/landing.

Query opsional:
- `spesialisasi`: filter berdasarkan kata kunci spesialisasi.

Response sudah diformat untuk frontend card list:
- `id`, `name`, `spec`, `rating`, `reviews`, `status`, `foto_profil`.
""",
)
def get_all_consultants(
    spesialisasi: Optional[str] = None,
    db: Client = Depends(get_supabase_client)
):
    return consultant_service.list_active_consultants(db, spesialisasi)


@router.get(
    "/me/schedules",
    summary="Konsultan melihat semua slot jadwal miliknya",
    description="Menampilkan daftar jadwal milik konsultan login, termasuk nama klien jika slot sudah dibooking.",
)
def get_my_schedules(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_my_schedules(db, current_user)


@router.get(
    "/me/dashboard-stats",
    status_code=status.HTTP_200_OK,
    summary="Statistik dashboard konsultan",
)
def get_consultant_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_dashboard_stats(db, current_user)


@router.get(
    "/me/requests/pending",
    summary="Daftar pengajuan pending untuk konsultan",
    description="Menampilkan daftar pengajuan konsultasi dengan status `pending` untuk konsultan login.",
)
def get_pending_requests(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_pending_requests(db, current_user)


@router.get(
    "/me/requests/active",
    summary="Daftar pengajuan aktif untuk konsultan",
    description="Menampilkan daftar pengajuan konsultasi dengan status `terjadwal` untuk konsultan login.",
)
def get_active_requests(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_active_requests(db, current_user)


@router.get(
    "/{id_konsultan}",
    status_code=status.HTTP_200_OK,
    summary="Detail profil konsultan publik",
    description="""
Mengambil profil detail konsultan berdasarkan `id_konsultan`.

Response mencakup:
- data profil konsultan
- data users terkait (nama, email, foto_profil)
- rating agregat
- jadwal_ketersediaan aktif
""",
)
def get_consultant_detail(id_konsultan: int, db: Client = Depends(get_supabase_client)):
    return consultant_service.get_consultant_detail(db, id_konsultan)


@router.get(
    "/{id_konsultan}/schedules",
    status_code=status.HTTP_200_OK,
    summary="Lihat jadwal tersedia per konsultan",
    description="Mengembalikan hanya slot jadwal yang masih tersedia (`status_tersedia=true`) untuk pengajuan client.",
)
def get_consultant_schedules(
    id_konsultan: int, db: Client = Depends(get_supabase_client)
):
    return consultant_service.get_available_schedules(db, id_konsultan)


@router.post(
    "/schedules",
    status_code=status.HTTP_201_CREATED,
    summary="Konsultan menambah slot jadwal",
    description="Khusus role konsultan untuk menambahkan slot jadwal ketersediaan baru.",
)
def upload_jadwal_konsultan(
    request: ScheduleCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.create_schedule(db, current_user, request)


@router.delete(
    "/schedules/{id_jadwal}",
    status_code=status.HTTP_200_OK,
    summary="Konsultan menghapus slot jadwal",
    description="Slot hanya bisa dihapus jika belum dibooking client (`status_tersedia=true`).",
)
def hapus_jadwal_konsultan(
    id_jadwal: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.delete_schedule(db, current_user, id_jadwal)


@router.put(
    "/schedules/{id_jadwal}",
    status_code=status.HTTP_200_OK,
    summary="Konsultan mengubah slot jadwal",
    description="Slot hanya bisa diubah jika belum dibooking client.",
)
def edit_jadwal_konsultan(
    id_jadwal: int,
    request: ScheduleUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.update_schedule(db, current_user, id_jadwal, request)


@router.patch(
    "/schedules/{id_jadwal}/toggle",
    summary="Toggle status ketersediaan per slot",
    description="Mengubah `status_tersedia` untuk satu slot jadwal tertentu.",
)
def toggle_schedule_slot(
    id_jadwal: int, payload: ScheduleToggle, db: Client = Depends(get_supabase_client)
):
    return consultant_service.toggle_schedule_slot(db, id_jadwal, payload)


@router.patch(
    "/me/active-status",
    summary="Toggle status aktif konsultan",
    description="Mengubah status global konsultan (`is_active`) untuk kontrol tampil di katalog publik.",
)
def toggle_global_active(
    payload: ConsultantActiveToggle,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.toggle_global_active(db, current_user, payload)


@router.get(
    "/me/clients",
    summary="Daftar Klien Terjadwal (Belum Lewat)",
    description="""
Page Daftar Klien: Menampilkan pengajuan berstatus 'terjadwal' yang jadwalnya belum lewat waktu sekarang.
"""
)
def get_daftar_klien(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_scheduled_clients(db, current_user)


@router.get(
    "/me/history",
    summary="Riwayat Konsultan",
    description="""
Page Riwayat Konsultan: Semua pengajuan KECUALI yang berstatus 'pending'.
Menampilkan status: menunggu_pembayaran, terjadwal, selesai, dibatalkan, ditolak, kedaluwarsa.
Disorting berdasarkan terbaru ke terlama.
"""
)
def get_riwayat_konsultan(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_history(db, current_user)
