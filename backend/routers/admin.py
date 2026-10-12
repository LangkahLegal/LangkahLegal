"""
Router untuk Admin Dashboard.

Endpoints (admin-only):
- Verifikasi Konsultan: list, detail, approve/reject
- Monitoring Komisi: list transaksi, summary
- Dashboard Stats: ringkasan platform
"""

from fastapi import APIRouter, Depends
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from schemas.admin import VerifyConsultantPayload
from services import admin_service

router = APIRouter()


@router.get("/stats")
def get_admin_stats(
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Ringkasan statistik platform untuk admin dashboard.

    Returns:
    - total_users: Jumlah seluruh user
    - total_clients: Jumlah user dengan role client
    - total_consultants: Jumlah konsultan terdaftar
    - pending_verification: Konsultan yang menunggu verifikasi
    - total_transactions: Jumlah transaksi yang settlement
    - total_revenue: Total gross amount dari semua transaksi settlement
    - total_commission: Total komisi platform (10%)
    """
    return admin_service.get_admin_stats(db, user)


@router.get("/consultants")
def get_consultants_list(
    status_filter: str = None,
    spesialisasi: str = None,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    List semua konsultan untuk verifikasi.

    Query params:
    - status_filter: 'pending' | 'terverifikasi' | None (semua)
    """
    return admin_service.list_consultants(db, user, status_filter, spesialisasi)


@router.get("/consultants/{id_konsultan}")
def get_consultant_detail(
    id_konsultan: int,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Detail lengkap konsultan untuk review verifikasi.

    Includes: profil user, spesialisasi, pengalaman, portofolio, rating, jadwal.
    """
    return admin_service.get_consultant_detail(db, user, id_konsultan)


@router.patch("/consultants/{id_konsultan}/verify")
def verify_consultant(
    id_konsultan: int,
    payload: VerifyConsultantPayload,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Approve atau reject konsultan.

    Payload:
    - action: 'terverifikasi' atau 'ditolak'
    - alasan: Alasan jika ditolak (opsional)
    """
    return admin_service.verify_consultant(db, user, id_konsultan, payload)


