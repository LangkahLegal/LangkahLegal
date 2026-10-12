import logging
from datetime import datetime

from supabase import Client

from core.constants import Role, StatusPembayaran, StatusPengajuan, StatusVerifikasi
from core.exceptions import BadRequestError, NotFoundError
from helpers.access import require_role
from repositories import (
    consultant_repository,
    consultation_repository,
    payment_repository,
    user_repository,
)
from schemas.admin import VerifyConsultantPayload

logger = logging.getLogger(__name__)


def require_admin(user: dict):
    require_role(user, Role.ADMIN, "Akses ditolak. Hanya admin yang bisa mengakses fitur ini.")


def _transaction_totals(db: Client) -> tuple[int, float, float]:
    try:
        stats_rows = payment_repository.get_stats_view(db)
        if not stats_rows:
            raise Exception("View kosong")
        stats = stats_rows[0]
        return (
            stats.get("total_transactions", 0),
            float(stats.get("total_revenue", 0) or 0),
            float(stats.get("total_commission", 0) or 0),
        )
    except Exception as e:
        logger.warning(f"Gagal memuat view admin_transaction_stats, fallback ke fetch semua transaksi: {e}")
        settled_txs = payment_repository.list_amounts_by_status(db, StatusPembayaran.SETTLEMENT) or []
        return (
            len(settled_txs),
            sum(float(tx.get("gross_amount") or 0) for tx in settled_txs),
            sum(float(tx.get("komisi_platform") or 0) for tx in settled_txs),
        )


def get_admin_stats(db: Client, user: dict) -> dict:
    require_admin(user)

    all_users = user_repository.list_roles(db) or []
    total_users = len(all_users)
    total_clients = sum(1 for u in all_users if u.get("role") == Role.CLIENT)

    all_konsultan = consultant_repository.list_verification_statuses(db) or []
    total_konsultan = len(all_konsultan)
    pending_verification = sum(1 for k in all_konsultan if k.get("status_verifikasi") == StatusVerifikasi.PENDING)

    total_transactions, total_revenue, total_commission = _transaction_totals(db)

    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_consultants": total_konsultan,
        "pending_verification": pending_verification,
        "total_transactions": total_transactions,
        "total_revenue": total_revenue,
        "total_commission": total_commission,
    }


def list_consultants(
    db: Client,
    user: dict,
    status_filter: str | None = None,
    spesialisasi: str | None = None,
) -> dict:
    require_admin(user)

    valid_statuses = (
        StatusVerifikasi.PENDING,
        StatusVerifikasi.TERVERIFIKASI,
        StatusVerifikasi.DITOLAK,
    )
    rows = consultant_repository.list_for_admin(
        db,
        status_verifikasi=status_filter if status_filter in valid_statuses else None,
        spesialisasi=spesialisasi if spesialisasi != "semua" else None,
    ) or []

    return {
        "data": rows,
        "total": len(rows),
    }


def get_consultant_detail(db: Client, user: dict, id_konsultan: int) -> dict:
    require_admin(user)

    konsultan = consultant_repository.get_by_id(
        db,
        id_konsultan,
        """
            *,
            users (id_user, nama, email, foto_profil, created_at),
            rating_ulasan (skor_rating, ulasan_teks, created_at)
        """,
    )

    if konsultan is None:
        raise NotFoundError("Konsultan tidak ditemukan.")

    ratings = [r["skor_rating"] for r in konsultan.get("rating_ulasan", []) if r.get("skor_rating")]
    total_reviews = len(ratings)
    rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

    konsultan["rating"] = rating_avg
    konsultan["total_reviews"] = total_reviews

    all_pengajuan = consultation_repository.list_by_konsultan(
        db, id_konsultan, "id_pengajuan, status_pengajuan"
    ) or []
    konsultan["total_consultations"] = len(all_pengajuan)
    konsultan["completed_consultations"] = sum(
        1 for p in all_pengajuan if p.get("status_pengajuan") == StatusPengajuan.SELESAI
    )

    return {"data": konsultan}


def verify_consultant(
    db: Client, user: dict, id_konsultan: int, payload: VerifyConsultantPayload
) -> dict:
    require_admin(user)

    valid_actions = (StatusVerifikasi.TERVERIFIKASI, StatusVerifikasi.DITOLAK)
    if payload.action not in valid_actions:
        raise BadRequestError(f"Action harus salah satu dari: {', '.join(valid_actions)}")

    if consultant_repository.get_by_id(db, id_konsultan, "id_konsultan, status_verifikasi") is None:
        raise NotFoundError("Konsultan tidak ditemukan.")

    update_data = {
        "status_verifikasi": payload.action,
        "updated_at": datetime.now().isoformat()
    }

    if payload.action == StatusVerifikasi.TERVERIFIKASI:
        update_data["is_active"] = True
        update_data["alasan_penolakan"] = None
    elif payload.action == StatusVerifikasi.DITOLAK and payload.alasan:
        update_data["alasan_penolakan"] = payload.alasan

    updated = consultant_repository.update_by_id(db, id_konsultan, update_data)

    action_label = "diverifikasi" if payload.action == StatusVerifikasi.TERVERIFIKASI else "ditolak"
    logger.info(f"Konsultan {id_konsultan} {action_label} oleh admin {user['id_user']}")

    return {
        "message": f"Konsultan berhasil {action_label}.",
        "data": updated[0] if updated else None,
    }
