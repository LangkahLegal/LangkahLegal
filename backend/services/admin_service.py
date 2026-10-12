import logging
from datetime import datetime

from supabase import Client

from exceptions import BadRequestError, ForbiddenError, NotFoundError
from schemas.admin import VerifyConsultantPayload

logger = logging.getLogger(__name__)


def require_admin(user: dict):
    """Pastikan user memiliki role admin."""
    if user.get("role") != "admin":
        raise ForbiddenError("Akses ditolak. Hanya admin yang bisa mengakses fitur ini.")


def get_admin_stats(db: Client, user: dict) -> dict:
    require_admin(user)

    users_res = db.table("users").select("id_user, role").execute()
    all_users = users_res.data or []
    total_users = len(all_users)
    total_clients = sum(1 for u in all_users if u.get("role") == "client")

    konsultan_res = db.table("konsultan").select("id_konsultan, status_verifikasi").execute()
    all_konsultan = konsultan_res.data or []
    total_konsultan = len(all_konsultan)
    pending_verification = sum(1 for k in all_konsultan if k.get("status_verifikasi") == "pending")

    try:
        view_res = db.table("admin_transaction_stats").select("*").execute()
        if view_res.data:
            stats = view_res.data[0]
            total_transactions = stats.get("total_transactions", 0)
            total_revenue = float(stats.get("total_revenue", 0) or 0)
            total_commission = float(stats.get("total_commission", 0) or 0)
        else:
            raise Exception("View kosong")
    except Exception as e:
        logger.warning(f"Gagal memuat view admin_transaction_stats, fallback ke fetch semua transaksi: {e}")
        tx_res = (
            db.table("transaksi")
            .select("gross_amount, komisi_platform")
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


def list_consultants(
    db: Client,
    user: dict,
    status_filter: str | None = None,
    spesialisasi: str | None = None,
) -> dict:
    require_admin(user)

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
            updated_at,
            pengalaman_tahun,
            kota_praktik,
            users (id_user, nama, email, foto_profil)
        """)
    )

    if status_filter and status_filter in ("pending", "terverifikasi", "ditolak"):
        query = query.eq("status_verifikasi", status_filter)

    if spesialisasi and spesialisasi != "semua":
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")

    query = query.order("updated_at", desc=True)
    result = query.execute()

    return {
        "data": result.data or [],
        "total": len(result.data or []),
    }


def get_consultant_detail(db: Client, user: dict, id_konsultan: int) -> dict:
    require_admin(user)

    result = (
        db.table("konsultan")
        .select("""
            *,
            users (id_user, nama, email, foto_profil, created_at),
            rating_ulasan (skor_rating, ulasan_teks, created_at)
        """)
        .eq("id_konsultan", id_konsultan)
        .execute()
    )

    if not result.data:
        raise NotFoundError("Konsultan tidak ditemukan.")

    konsultan = result.data[0]

    ratings = [r["skor_rating"] for r in konsultan.get("rating_ulasan", []) if r.get("skor_rating")]
    total_reviews = len(ratings)
    rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

    konsultan["rating"] = rating_avg
    konsultan["total_reviews"] = total_reviews

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


def verify_consultant(
    db: Client, user: dict, id_konsultan: int, payload: VerifyConsultantPayload
) -> dict:
    require_admin(user)

    valid_actions = ("terverifikasi", "ditolak")
    if payload.action not in valid_actions:
        raise BadRequestError(f"Action harus salah satu dari: {', '.join(valid_actions)}")

    check = (
        db.table("konsultan")
        .select("id_konsultan, status_verifikasi")
        .eq("id_konsultan", id_konsultan)
        .execute()
    )
    if not check.data:
        raise NotFoundError("Konsultan tidak ditemukan.")

    update_data = {
        "status_verifikasi": payload.action,
        "updated_at": datetime.now().isoformat()
    }

    if payload.action == "terverifikasi":
        update_data["is_active"] = True
        update_data["alasan_penolakan"] = None
    elif payload.action == "ditolak" and payload.alasan:
        update_data["alasan_penolakan"] = payload.alasan

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
