"""
Router untuk Admin Dashboard.

Endpoints (admin-only):
- Verifikasi Konsultan: list, detail, approve/reject
- Monitoring Komisi: list transaksi, summary
- Dashboard Stats: ringkasan platform
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from schemas.admin import VerifyConsultantPayload

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Helpers ───────────────────────────────────────────────────────────────

def _require_admin(user: dict):
    """Pastikan user memiliki role admin."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya admin yang bisa mengakses fitur ini.",
        )


# ═══════════════════════════════════════════════════════════════════════════
# DASHBOARD STATS
# ═══════════════════════════════════════════════════════════════════════════

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
    _require_admin(user)

    # Total users by role
    users_res = db.table("users").select("id_user, role").execute()
    all_users = users_res.data or []
    total_users = len(all_users)
    total_clients = sum(1 for u in all_users if u.get("role") == "client")

    # Konsultan stats
    konsultan_res = db.table("konsultan").select("id_konsultan, status_verifikasi").execute()
    all_konsultan = konsultan_res.data or []
    total_konsultan = len(all_konsultan)
    pending_verification = sum(1 for k in all_konsultan if k.get("status_verifikasi") == "pending")

    # Transaction stats (hanya settlement)
    tx_res = (
        db.table("transaksi")
        .select("gross_amount, komisi_platform, nominal_konsultan, status_pembayaran")
        .eq("status_pembayaran", "settlement")
        .execute()
    )
    settled_txs = tx_res.data or []
    total_transactions = len(settled_txs)
    total_revenue = sum(float(tx.get("gross_amount") or 0) for tx in settled_txs)
    total_commission = sum(float(tx.get("komisi_platform") or 0) for tx in settled_txs)

    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_consultants": total_konsultan,
        "pending_verification": pending_verification,
        "total_transactions": total_transactions,
        "total_revenue": total_revenue,
        "total_commission": total_commission,
    }


# ═══════════════════════════════════════════════════════════════════════════
# VERIFIKASI KONSULTAN
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/consultants")
def get_consultants_list(
    status_filter: str = None,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    List semua konsultan untuk verifikasi.

    Query params:
    - status_filter: 'pending' | 'terverifikasi' | None (semua)
    """
    _require_admin(user)

    query = (
        db.table("konsultan")
        .select("""
            id_konsultan,
            nama_lengkap,
            spesialisasi,
            tarif_per_sesi,
            is_active,
            status_verifikasi,
            created_at,
            users (id_user, nama, email, foto_profil)
        """)
    )

    if status_filter and status_filter in ("pending", "terverifikasi"):
        query = query.eq("status_verifikasi", status_filter)

    query = query.order("created_at", desc=True)
    result = query.execute()

    return {
        "data": result.data or [],
        "total": len(result.data or []),
    }


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
    _require_admin(user)

    result = (
        db.table("konsultan")
        .select("""
            *,
            users (id_user, nama, email, foto_profil, created_at),
            rating_ulasan (skor_rating, ulasan, created_at)
        """)
        .eq("id_konsultan", id_konsultan)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Konsultan tidak ditemukan.")

    konsultan = result.data[0]

    # Hitung rating agregat
    ratings = [r["skor_rating"] for r in konsultan.get("rating_ulasan", []) if r.get("skor_rating")]
    total_reviews = len(ratings)
    rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

    konsultan["rating"] = rating_avg
    konsultan["total_reviews"] = total_reviews

    # Hitung jumlah konsultasi
    pengajuan_res = (
        db.table("pengajuan_konsultasi")
        .select("id_pengajuan, status_pengajuan")
        .eq("id_konsultan", id_konsultan)
        .execute()
    )
    all_pengajuan = pengajuan_res.data or []
    konsultan["total_consultations"] = len(all_pengajuan)
    konsultan["completed_consultations"] = sum(
        1 for p in all_pengajuan if p.get("status_pengajuan") == "selesai"
    )

    return {"data": konsultan}


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
    _require_admin(user)

    # Validasi action
    valid_actions = ("terverifikasi", "ditolak")
    if payload.action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Action harus salah satu dari: {', '.join(valid_actions)}",
        )

    # Cek konsultan ada
    check = (
        db.table("konsultan")
        .select("id_konsultan, status_verifikasi")
        .eq("id_konsultan", id_konsultan)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Konsultan tidak ditemukan.")

    # Update status verifikasi
    update_data = {
        "status_verifikasi": payload.action,
    }

    # Jika diverifikasi, aktifkan konsultan
    if payload.action == "terverifikasi":
        update_data["is_active"] = True

    result = (
        db.table("konsultan")
        .update(update_data)
        .eq("id_konsultan", id_konsultan)
        .execute()
    )

    action_label = "diverifikasi" if payload.action == "terverifikasi" else "ditolak"
    logger.info(f"Konsultan {id_konsultan} {action_label} oleh admin {user['id_user']}")

    return {
        "message": f"Konsultan berhasil {action_label}.",
        "data": result.data[0] if result.data else None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# MONITORING KOMISI / TRANSAKSI
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/transactions")
def get_all_transactions(
    status_filter: str = None,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    List semua transaksi dengan breakdown komisi.

    Query params:
    - status_filter: 'pending' | 'settlement' | 'cancel' | 'expire' | None (semua)
    """
    _require_admin(user)

    query = (
        db.table("transaksi")
        .select("""
            *,
            pengajuan_konsultasi (
                id_pengajuan,
                deskripsi_kasus,
                tanggal_pengajuan,
                users (nama, email),
                konsultan (nama_lengkap, spesialisasi)
            )
        """)
    )

    if status_filter:
        query = query.eq("status_pembayaran", status_filter)

    query = query.order("created_at", desc=True)
    result = query.execute()

    return {
        "data": result.data or [],
        "total": len(result.data or []),
    }


@router.get("/transactions/summary")
def get_transaction_summary(
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    Summary transaksi untuk monitoring komisi.

    Returns:
    - total_gross: Total gross amount (semua settlement)
    - total_commission: Total komisi platform
    - total_consultant_payout: Total yang dibayarkan ke konsultan
    - transaction_count: Jumlah transaksi per status
    """
    _require_admin(user)

    # Semua transaksi
    all_tx_res = (
        db.table("transaksi")
        .select("gross_amount, komisi_platform, nominal_konsultan, status_pembayaran")
        .execute()
    )
    all_txs = all_tx_res.data or []

    # Hitung per status
    status_counts = {}
    for tx in all_txs:
        s = tx.get("status_pembayaran", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    # Hanya settlement yang masuk revenue
    settled = [tx for tx in all_txs if tx.get("status_pembayaran") == "settlement"]
    total_gross = sum(float(tx.get("gross_amount") or 0) for tx in settled)
    total_commission = sum(float(tx.get("komisi_platform") or 0) for tx in settled)
    total_consultant_payout = sum(float(tx.get("nominal_konsultan") or 0) for tx in settled)

    return {
        "total_gross": total_gross,
        "total_commission": total_commission,
        "total_consultant_payout": total_consultant_payout,
        "total_settled": len(settled),
        "total_all": len(all_txs),
        "by_status": status_counts,
    }
