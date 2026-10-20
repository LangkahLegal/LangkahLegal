import logging
from datetime import datetime
from typing import Optional

from supabase import Client

from core.constants import Role, StatusPembayaran, StatusPengajuan
from core.exceptions import BadRequestError, InternalError, NotFoundError
from core.user import CurrentUser
from helpers.access import require_konsultan_id, require_role
from helpers.filters import date_range, time_range
from helpers.listing import clean_search, page_window, with_pagination
from helpers.rating import summarize_ratings
from helpers.schedule import ensure_valid_slot, generate_available_slots, is_past, now_wib
from repositories import consultant_repository, consultation_repository, schedule_repository
from schemas.consultants import (
    ClientListFilters,
    ConsultantActiveToggle,
    ScheduleCreate,
    ScheduleToggle,
    ScheduleUpdate,
    StatusKlien,
    UrutanKlien,
)

logger = logging.getLogger(__name__)

VERIFIED_FILTERS = {"terverifikasi": True, "non-verified": False}

UNPAID_STATUSES = [
    "cancelled",
    StatusPengajuan.DIBATALKAN,
    StatusPengajuan.DITOLAK,
    StatusPengajuan.KEDALUWARSA,
]


def list_active_consultants(
    db: Client,
    spesialisasi: Optional[str] = None,
    search: Optional[str] = None,
    verified: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: Optional[int] = None,
    page_size: int = 20,
) -> dict:
    try:
        offset, limit = page_window(page, page_size)
        rows, total = consultant_repository.list_active_catalog(
            db,
            spesialisasi=spesialisasi if spesialisasi != "semua" else None,
            search=clean_search(search) or None,
            verified=VERIFIED_FILTERS.get(verified),
            min_price=min_price,
            max_price=max_price,
            offset=offset,
            limit=limit,
        )

        formatted_data = []
        for item in rows:
            rating_avg, total_reviews = summarize_ratings(item.get("rating_ulasan", []))
            user_data = item.get("users") or {}

            formatted_data.append(
                {
                    "id": item["id_konsultan"],
                    "name": item["nama_lengkap"],
                    "spec": item["spesialisasi"],
                    "rating": rating_avg,
                    "reviews": total_reviews,
                    "status": "online",
                    "foto_profil": user_data.get("foto_profil"),
                    "status_verifikasi": item.get("status_verifikasi"),
                    "tarif_per_sesi": item.get("tarif_per_sesi"),
                }
            )

        payload = {"message": "Katalog konsultan berhasil dimuat", "data": formatted_data}
        return with_pagination(payload, total if total is not None else len(formatted_data), page, page_size)
    except Exception as e:
        logger.error(f"Backend Error: {e}")
        return {"data": [], "message": str(e)}


def get_consultant_detail(db: Client, id_konsultan: int) -> dict:
    konsultan_data = consultant_repository.get_public_detail(db, id_konsultan)

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


ACTIVE_BOOKING_STATUSES = [
    StatusPengajuan.TERJADWAL,
    StatusPengajuan.PENDING,
    StatusPengajuan.MENUNGGU_PEMBAYARAN,
]


def get_available_slots(
    db: Client,
    id_konsultan: int,
    tanggal: str,
    durasi: int = 30,
) -> dict:
    """Kembalikan daftar slot waktu tersedia untuk konsultan pada tanggal & durasi tertentu.

    Args:
        db: Supabase client.
        id_konsultan: ID konsultan.
        tanggal: Tanggal format YYYY-MM-DD.
        durasi: Durasi konsultasi dalam menit (kelipatan 30, 30–240).

    Returns:
        Dict dengan key `tanggal`, `durasi`, dan `slots` (list slot).
    """
    # 1. Cari jadwal konsultan untuk tanggal tersebut
    jadwal_rows = (
        db.table("jadwal_ketersediaan")
        .select("id_jadwal, tanggal, jam_mulai, jam_selesai, status_tersedia")
        .eq("id_konsultan", id_konsultan)
        .eq("tanggal", tanggal)
        .eq("status_tersedia", True)
        .limit(1)
        .execute()
        .data
    )

    if not jadwal_rows:
        return {
            "message": "Tidak ada jadwal tersedia pada tanggal ini",
            "tanggal": tanggal,
            "durasi": durasi,
            "slots": [],
        }

    day_schedule = jadwal_rows[0]

    # 2. Ambil booking aktif konsultan untuk tanggal tersebut
    booked_sessions = consultation_repository.list_booked_slots(db, id_konsultan, ACTIVE_BOOKING_STATUSES)
    # Filter hanya tanggal yang relevan (list_booked_slots sudah filter by id_konsultan)
    booked_for_date = [b for b in booked_sessions if str(b.get("tanggal_pengajuan", "")).split("T")[0] == tanggal]

    # 3. Generate slot pills
    slots = generate_available_slots(
        day_schedule=day_schedule,
        booked_sessions=booked_for_date,
        duration_minutes=durasi,
    )

    return {
        "message": "Slot tersedia berhasil dimuat",
        "tanggal": tanggal,
        "durasi": durasi,
        "id_jadwal": day_schedule.get("id_jadwal"),
        "slots": slots,
    }


def get_my_schedules(db: Client, current_user: CurrentUser) -> list:
    id_kons = require_konsultan_id(db, current_user)

    formatted = []
    for item in schedule_repository.list_with_clients(db, id_kons):
        pengajuan = item.get("pengajuan_konsultasi", [])
        nama_klien = pengajuan[0]["users"]["nama"] if pengajuan and pengajuan[0].get("users") else None
        formatted.append({**item, "nama_klien": nama_klien})
    return formatted


BOOKING_STATUSES = [StatusPengajuan.PENDING, StatusPengajuan.MENUNGGU_PEMBAYARAN, StatusPengajuan.TERJADWAL]


def get_dashboard_stats(db: Client, current_user: CurrentUser) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user)

    pengajuan_with_tx = consultation_repository.list_income_rows(db, id_kons)

    total_income = 0
    for p in pengajuan_with_tx:
        tx_list = p.get("transaksi") or []
        if isinstance(tx_list, dict):
            tx_list = [tx_list]
        for tx in tx_list:
            if tx.get("status_pembayaran") == StatusPembayaran.SETTLEMENT:
                total_income += float(tx.get("nominal_konsultan") or 0)

    all_data = (
        consultation_repository.list_clients_by_statuses(
            db, id_kons, [StatusPengajuan.TERJADWAL, StatusPengajuan.SELESAI]
        )
        or []
    )

    unique_klien = set(p["id_user"] for p in all_data)
    sesi_aktif = [p for p in all_data if p["status_pengajuan"] == StatusPengajuan.TERJADWAL]

    return {
        "total_income": total_income,
        "total_klien": len(unique_klien),
        "total_klien_aktif": len(sesi_aktif),
        "is_active": consultant_repository.is_active(db, id_kons),
    }


def _with_past_flag(rows: list[dict]) -> list[dict]:
    """Tandai pengajuan yang jam mulainya sudah lewat; pengajuan tanpa jadwal tidak pernah dianggap lewat."""
    now = now_wib()
    return [
        {
            **row,
            "sudah_lewat": bool(row.get("jam_mulai")) and is_past(row.get("tanggal_pengajuan"), row["jam_mulai"], now),
        }
        for row in rows
    ]


def get_pending_requests(db: Client, current_user: CurrentUser) -> list:
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user)

    return _with_past_flag(consultation_repository.list_requests_for_konsultan(db, id_kons, [StatusPengajuan.PENDING]))


ACTIVE_CLIENT_STATUSES = [StatusPengajuan.TERJADWAL, StatusPengajuan.MENUNGGU_PEMBAYARAN]

CLIENT_ORDER_COLUMNS = {
    UrutanKlien.TERBARU: [("created_at", True)],
    UrutanKlien.TERLAMA: [("created_at", False)],
    UrutanKlien.JADWAL_TERDEKAT: [("tanggal_pengajuan", False), ("jam_mulai", False)],
    UrutanKlien.JADWAL_TERJAUH: [("tanggal_pengajuan", True), ("jam_mulai", True)],
}


def get_active_requests(db: Client, current_user: CurrentUser, filters: ClientListFilters) -> list:
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user)
    statuses = ACTIVE_CLIENT_STATUSES if filters.status == StatusKlien.SEMUA else [filters.status.value]
    tanggal_dari, tanggal_sebelum = date_range(filters.jadwal)
    jam_dari, jam_sebelum = time_range(filters.waktu)

    return _with_past_flag(
        consultation_repository.list_requests_for_konsultan(
            db,
            id_kons,
            statuses,
            search=clean_search(filters.search) or None,
            tanggal_dari=tanggal_dari,
            tanggal_sebelum=tanggal_sebelum,
            jam_dari=jam_dari,
            jam_sebelum=jam_sebelum,
            urutan=CLIENT_ORDER_COLUMNS[filters.urutkan],
        )
    )


def _format_upcoming_client(req: dict, now: datetime) -> dict | None:
    jadwal = req.get("jadwal_ketersediaan") or {}
    if isinstance(jadwal, list):
        jadwal = jadwal[0] if len(jadwal) > 0 else {}

    tanggal_konsultasi = req.get("tanggal_pengajuan") or jadwal.get("tanggal")
    jam_selesai_str = str(req.get("jam_selesai", ""))[:5]

    if not tanggal_konsultasi:
        return None

    if is_past(tanggal_konsultasi, jam_selesai_str, now):
        return None

    return {
        "id_pengajuan": req["id_pengajuan"],
        "nama_klien": req.get("users", {}).get("nama"),
        "foto_profil": req.get("users", {}).get("foto_profil"),
        "tanggal_konsultasi": tanggal_konsultasi,
        "waktu_mulai": str(req.get("jam_mulai", ""))[:5],
        "waktu_selesai": jam_selesai_str,
        "tanggal_pengajuan": req.get("tanggal_pengajuan") or req.get("created_at"),
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
        "nominal_konsultan": _earned_amount(req),
    }


def get_scheduled_clients(db: Client, current_user: CurrentUser) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    id_kons = require_konsultan_id(db, current_user, "Profil tidak ditemukan")

    rows = consultation_repository.list_with_client_and_date(db, id_kons, [StatusPengajuan.TERJADWAL])

    now = now_wib()
    formatted_data = [item for item in (_format_upcoming_client(req, now) for req in rows) if item is not None]

    return {"total_klien_aktif": len(formatted_data), "data": formatted_data}


def get_next_session(db: Client, current_user: CurrentUser) -> dict:
    """Sesi terjadwal terdekat yang belum lewat (waktu WIB), atau None."""
    require_role(current_user, Role.KONSULTAN, "Hanya untuk konsultan")

    id_kons = require_konsultan_id(db, current_user)
    rows = consultation_repository.list_requests_for_konsultan(db, id_kons, [StatusPengajuan.TERJADWAL])

    now = now_wib()
    upcoming = [
        row
        for row in rows
        if row.get("tanggal_pengajuan")
        and row.get("jam_mulai")
        and not is_past(row["tanggal_pengajuan"], row["jam_mulai"], now)
    ]
    upcoming.sort(key=lambda row: (str(row["tanggal_pengajuan"]).split("T")[0], str(row["jam_mulai"])))

    return {"data": upcoming[0] if upcoming else None}


def get_history(db: Client, current_user: CurrentUser) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    id_kons = require_konsultan_id(db, current_user, "Profil tidak ditemukan")

    rows = consultation_repository.list_history_for_konsultan(db, id_kons, StatusPengajuan.PENDING)

    formatted_data = [_format_history_item(req) for req in rows]
    formatted_data.sort(key=lambda x: (x["tanggal_konsultasi"] or "", x["jam_mulai"] or ""), reverse=True)

    total_selesai = sum(1 for item in formatted_data if item["status"] == StatusPengajuan.SELESAI)

    return {"total_sesi_selesai": total_selesai, "data": formatted_data}


def create_schedule(db: Client, current_user: CurrentUser, request: ScheduleCreate) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengatur jadwal")

    id_kons = require_konsultan_id(db, current_user)
    ensure_valid_slot(request.tanggal, request.jam_mulai, request.jam_selesai)

    created = schedule_repository.insert(
        db,
        {
            "id_konsultan": id_kons,
            "tanggal": request.tanggal,
            "jam_mulai": request.jam_mulai,
            "jam_selesai": request.jam_selesai,
            "status_tersedia": True,
        },
    )

    return {"message": "Jadwal berhasil ditambahkan", "data": created[0]}


def delete_schedule(db: Client, current_user: CurrentUser, id_jadwal: int) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    jadwal = schedule_repository.get_by_id(db, id_jadwal)
    if jadwal is None:
        raise NotFoundError("Jadwal tidak ditemukan")

    if consultation_repository.list_by_schedule_and_statuses(db, id_jadwal, BOOKING_STATUSES):
        raise BadRequestError("Jadwal tidak bisa dihapus karena sudah dipesan klien")

    schedule_repository.delete(db, id_jadwal)
    return {"message": "Jadwal berhasil dihapus"}


def update_schedule(db: Client, current_user: CurrentUser, id_jadwal: int, request: ScheduleUpdate) -> dict:
    require_role(current_user, Role.KONSULTAN, "Akses ditolak")

    jadwal = schedule_repository.get_by_id(db, id_jadwal)
    if jadwal is None:
        raise NotFoundError("Jadwal tidak ditemukan")
    if consultation_repository.list_by_schedule_and_statuses(db, id_jadwal, BOOKING_STATUSES):
        raise BadRequestError("Jadwal sudah dipesan klien dan tidak dapat diubah")

    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    merged = {**jadwal, **update_data}
    ensure_valid_slot(merged["tanggal"], merged["jam_mulai"], merged["jam_selesai"])

    updated = schedule_repository.update(db, id_jadwal, update_data)
    return {"message": "Jadwal berhasil diperbarui", "data": updated[0]}


def toggle_schedule_slot(db: Client, id_jadwal: int, payload: ScheduleToggle) -> dict:
    updated = schedule_repository.set_available(db, id_jadwal, payload.status_tersedia)
    return {"data": updated, "count": None}


def toggle_global_active(db: Client, current_user: CurrentUser, payload: ConsultantActiveToggle) -> dict:
    updated = consultant_repository.update_by_user(db, current_user.id_user, {"is_active": payload.is_active})
    return {"data": updated, "count": None}
