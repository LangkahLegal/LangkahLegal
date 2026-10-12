import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from supabase import Client

from core.constants import Role, StatusPembayaran, StatusPengajuan
from core.exceptions import BadRequestError, InternalError, NotFoundError
from helpers.access import require_konsultan_id, require_role
from helpers.rating import summarize_ratings
from repositories import consultant_repository, consultation_repository, schedule_repository
from schemas.consultants import (
    ConsultantActiveToggle,
    ScheduleCreate,
    ScheduleToggle,
    ScheduleUpdate,
)

logger = logging.getLogger(__name__)

WIB = timezone(timedelta(hours=7))
UNPAID_STATUSES = [
    "cancelled",
    StatusPengajuan.DIBATALKAN,
    StatusPengajuan.DITOLAK,
    StatusPengajuan.KEDALUWARSA,
]


def list_active_consultants(db: Client, spesialisasi: Optional[str] = None) -> dict:
    try:
        rows = consultant_repository.list_active_catalog(
            db, spesialisasi if spesialisasi != "semua" else None
        )

        formatted_data = []
        for item in rows:
            rating_avg, total_reviews = summarize_ratings(item.get("rating_ulasan", []))
            user_data = item.get("users") or {}

            formatted_data.append({
                "id": item["id_konsultan"],
                "name": item["nama_lengkap"],
                "spec": item["spesialisasi"],
                "rating": rating_avg,
                "reviews": total_reviews,
                "status": "online",
                "foto_profil": user_data.get("foto_profil"),
                "status_verifikasi": item.get("status_verifikasi"),
                "tarif_per_sesi": item.get("tarif_per_sesi")
            })

        return {
            "message": "Katalog konsultan berhasil dimuat",
            "data": formatted_data,
        }
    except Exception as e:
        logger.error(f"Backend Error: {e}")
        return {"data": [], "message": str(e)}


def get_consultant_detail(db: Client, id_konsultan: int) -> dict:
    konsultan_data = consultant_repository.get_by_id(
        db, id_konsultan, "*, users(nama, email, foto_profil), rating_ulasan(skor_rating)"
    )

    if konsultan_data is None:
        raise NotFoundError("Konsultan tidak ditemukan")

    rating_avg, total_reviews = summarize_ratings(konsultan_data.get("rating_ulasan", []))

    konsultan_data.pop("rating_ulasan", None)
    konsultan_data["rating"] = rating_avg
    konsultan_data["reviews"] = total_reviews
    konsultan_data["jadwal_ketersediaan"] = schedule_repository.list_available_by_date(db, id_konsultan)

    return {"message": "Detail profil ditemukan", "data": konsultan_data}


def get_available_schedules(db: Client, id_konsultan: int) -> dict:
    try:
        return {
            "status": "success",
            "id_konsultan": id_konsultan,
            "data": schedule_repository.list_available(db, id_konsultan),
        }
    except Exception as e:
        raise InternalError(f"Gagal mengambil jadwal: {str(e)}")


def get_my_schedules(db: Client, current_user: dict) -> list:
    id_kons = require_konsultan_id(db, current_user["id_user"])

    formatted = []
    for item in schedule_repository.list_with_clients(db, id_kons):
        pengajuan = item.get("pengajuan_konsultasi", [])
        nama_klien = (
            pengajuan[0]["users"]["nama"]
            if pengajuan and pengajuan[0].get("users")
            else None
        )
        formatted.append({**item, "nama_klien": nama_klien})
    return formatted


def get_dashboard_stats(db: Client, current_user: dict) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user["id_user"])

    pengajuan_with_tx = consultation_repository.list_by_konsultan(
        db, id_kons, "transaksi(nominal_konsultan, status_pembayaran)"
    )

    total_income = 0
    for p in pengajuan_with_tx:
        tx_list = p.get("transaksi") or []
        if isinstance(tx_list, dict):
            tx_list = [tx_list]
        for tx in tx_list:
            if tx.get("status_pembayaran") == StatusPembayaran.SETTLEMENT:
                total_income += float(tx.get("nominal_konsultan") or 0)

    all_data = consultation_repository.list_by_konsultan_and_statuses(
        db,
        id_kons,
        [StatusPengajuan.TERJADWAL, StatusPengajuan.SELESAI],
        "id_user, status_pengajuan",
    ) or []

    unique_klien = set(p["id_user"] for p in all_data)
    sesi_aktif = [p for p in all_data if p["status_pengajuan"] == StatusPengajuan.TERJADWAL]

    return {
        "total_income": total_income,
        "total_klien": len(unique_klien),
        "total_klien_aktif": len(sesi_aktif),
    }


def get_pending_requests(db: Client, current_user: dict) -> list:
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user["id_user"])

    return consultation_repository.list_requests_for_konsultan(db, id_kons, [StatusPengajuan.PENDING])


def get_active_requests(db: Client, current_user: dict) -> list:
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user["id_user"])

    return consultation_repository.list_requests_for_konsultan(
        db, id_kons, [StatusPengajuan.TERJADWAL, StatusPengajuan.MENUNGGU_PEMBAYARAN]
    )


def _format_upcoming_client(req: dict, now: datetime) -> dict | None:
    jadwal = req.get("jadwal_ketersediaan") or {}
    if isinstance(jadwal, list):
        jadwal = jadwal[0] if len(jadwal) > 0 else {}

    tanggal_konsultasi = req.get("tanggal_pengajuan") or jadwal.get("tanggal")
    jam_selesai_str = str(req.get("jam_selesai", ""))[:5]

    if not tanggal_konsultasi:
        return None

    try:
        deadline = datetime.strptime(f"{tanggal_konsultasi} {jam_selesai_str or '23:59'}", "%Y-%m-%d %H:%M")
    except ValueError:
        deadline = datetime.strptime(tanggal_konsultasi, "%Y-%m-%d").replace(hour=23, minute=59)

    if now > deadline:
        return None

    return {
        "id_pengajuan": req["id_pengajuan"],
        "nama_klien": req.get("users", {}).get("nama"),
        "foto_profil": req.get("users", {}).get("foto_profil"),
        "tanggal_konsultasi": tanggal_konsultasi,
        "waktu_mulai": str(req.get("jam_mulai", ""))[:5],
        "waktu_selesai": jam_selesai_str,
        "tanggal_pengajuan": req.get("tanggal_pengajuan") or req.get("created_at")
    }


def _earned_amount(req: dict) -> float:
    if req.get("status_pengajuan") in UNPAID_STATUSES:
        return 0

    trans = req.get("transaksi") or []
    if isinstance(trans, list):
        trans = trans[0] if trans else {}
    return trans.get("nominal_konsultan") or 0


def _format_history_item(req: dict) -> dict:
    jadwal = req.get("jadwal_ketersediaan") or {}
    jm = str(req.get("jam_mulai", ""))[:5]
    js = str(req.get("jam_selesai", ""))[:5]

    return {
        "id_pengajuan": req["id_pengajuan"],
        "id_bursa": req.get("id_bursa"),
        "nama_klien": req.get("users", {}).get("nama"),
        "foto_profil": req.get("users", {}).get("foto_profil"),
        "rentang_waktu": f"{jm} - {js}" if jm and js else "",
        "status": req.get("status_pengajuan"),
        "tanggal_konsultasi": jadwal.get("tanggal") or req.get("tanggal_pengajuan", ""),
        "jam_mulai": jm,
        "jam_selesai": js,
        "nominal_konsultan": _earned_amount(req)
    }


def get_scheduled_clients(db: Client, current_user: dict) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    id_kons = require_konsultan_id(db, current_user["id_user"], "Profil tidak ditemukan")

    rows = consultation_repository.list_by_konsultan_and_statuses(
        db,
        id_kons,
        [StatusPengajuan.TERJADWAL],
        "*, users(nama, foto_profil), jadwal_ketersediaan(tanggal)",
    )

    now = datetime.now(WIB).replace(tzinfo=None)
    formatted_data = [
        item for item in (_format_upcoming_client(req, now) for req in rows) if item is not None
    ]

    return {
        "total_klien_aktif": len(formatted_data),
        "data": formatted_data
    }


def get_history(db: Client, current_user: dict) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    id_kons = require_konsultan_id(db, current_user["id_user"], "Profil tidak ditemukan")

    rows = consultation_repository.list_history_for_konsultan(db, id_kons, StatusPengajuan.PENDING)

    formatted_data = [_format_history_item(req) for req in rows]
    formatted_data.sort(key=lambda x: x["tanggal_konsultasi"], reverse=True)

    total_selesai = sum(1 for item in formatted_data if item["status"] == StatusPengajuan.SELESAI)

    return {
        "total_sesi_selesai": total_selesai,
        "data": formatted_data
    }


def create_schedule(db: Client, current_user: dict, request: ScheduleCreate) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengatur jadwal")

    id_kons = require_konsultan_id(db, current_user["id_user"])

    created = schedule_repository.insert(db, {
        "id_konsultan": id_kons,
        "tanggal": request.tanggal,
        "jam_mulai": request.jam_mulai,
        "jam_selesai": request.jam_selesai,
        "status_tersedia": True,
    })

    return {"message": "Jadwal berhasil ditambahkan", "data": created[0]}


def delete_schedule(db: Client, current_user: dict, id_jadwal: int) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    jadwal = schedule_repository.get_by_id(db, id_jadwal)
    if jadwal is None:
        raise NotFoundError("Jadwal tidak ditemukan")

    if not jadwal["status_tersedia"]:
        raise BadRequestError("Jadwal tidak bisa dihapus karena sudah dipesan klien")

    schedule_repository.delete(db, id_jadwal)
    return {"message": "Jadwal berhasil dihapus"}


def update_schedule(
    db: Client, current_user: dict, id_jadwal: int, request: ScheduleUpdate
) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    jadwal = schedule_repository.get_by_id(db, id_jadwal)
    if jadwal is None or not jadwal["status_tersedia"]:
        raise BadRequestError("Jadwal tidak ditemukan atau sudah dipesan")

    update_data = {k: v for k, v in request.model_dump().items() if v is not None}

    updated = schedule_repository.update(db, id_jadwal, update_data)
    return {"message": "Jadwal berhasil diperbarui", "data": updated[0]}


def toggle_schedule_slot(db: Client, id_jadwal: int, payload: ScheduleToggle) -> dict:
    updated = schedule_repository.set_available(db, id_jadwal, payload.status_tersedia)
    return {"data": updated, "count": None}


def toggle_global_active(db: Client, current_user: dict, payload: ConsultantActiveToggle) -> dict:
    updated = consultant_repository.update_by_user(
        db, current_user["id_user"], {"is_active": payload.is_active}
    )
    return {"data": updated, "count": None}
