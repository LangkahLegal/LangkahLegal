import math
from datetime import datetime, timedelta, timezone

from core.exceptions import BadRequestError

SESSION_MINUTES = 30
WIB = timezone(timedelta(hours=7))
END_OF_DAY = "23:59"


def now_wib() -> datetime:
    return datetime.now(WIB).replace(tzinfo=None)


def is_past(tanggal, jam=None, now: datetime | None = None) -> bool:
    """Apakah tanggal + jam (waktu WIB) sudah lewat. Tanpa jam yang valid, dihitung sampai akhir hari."""
    date_part = str(tanggal or "").split("T")[0]
    if not date_part:
        return False

    try:
        day = datetime.strptime(date_part, "%Y-%m-%d")
    except ValueError:
        return False

    try:
        minutes = _to_minutes(str(jam))
    except (ValueError, IndexError):
        minutes = _to_minutes(END_OF_DAY)

    return (now or now_wib()) > day + timedelta(minutes=minutes)


def ensure_not_past(tanggal, jam) -> None:
    if is_past(tanggal, jam):
        raise BadRequestError("Waktu konsultasi yang dipilih sudah lewat")


def ensure_valid_slot(tanggal, jam_mulai, jam_selesai) -> None:
    if _to_minutes(str(jam_selesai)) <= _to_minutes(str(jam_mulai)):
        raise BadRequestError("Jam selesai harus setelah jam mulai")
    if is_past(tanggal, jam_selesai):
        raise BadRequestError("Jadwal tidak dapat dibuat pada waktu yang sudah lewat")


def _to_minutes(time_str: str) -> int:
    hours, minutes = time_str.split(":")[:2]
    return int(hours) * 60 + int(minutes)


def count_sessions(jam_mulai: str, jam_selesai: str) -> int:
    if not jam_mulai or not jam_selesai:
        return 1

    try:
        diff = _to_minutes(jam_selesai) - _to_minutes(jam_mulai)
    except (ValueError, IndexError):
        return 1

    if diff < 0:
        diff += 24 * 60

    return max(1, math.ceil(diff / SESSION_MINUTES))


def ensure_within_schedule(jam_mulai: str, jam_selesai: str, jadwal: dict) -> None:
    if jam_mulai < jadwal["jam_mulai"] or jam_selesai > jadwal["jam_selesai"]:
        raise BadRequestError(f"Jam di luar rentang operasional ({jadwal['jam_mulai']} - {jadwal['jam_selesai']})")


def _slot_minutes(jam_mulai, jam_selesai) -> tuple[int, int] | None:
    try:
        return _to_minutes(str(jam_mulai)), _to_minutes(str(jam_selesai))
    except (ValueError, IndexError):
        return None


def find_conflict(tanggal, jam_mulai, jam_selesai, bookings: list[dict]) -> tuple[str, str] | None:
    target_date = str(tanggal or "").split("T")[0]
    target = _slot_minutes(jam_mulai, jam_selesai)
    if not target_date or target is None:
        return None

    for booking in bookings:
        jadwal = booking.get("jadwal_ketersediaan") or {}
        if isinstance(jadwal, list):
            jadwal = jadwal[0] if jadwal else {}

        booking_date = str(jadwal.get("tanggal") or booking.get("tanggal_pengajuan") or "").split("T")[0]
        if booking_date != target_date:
            continue

        start = booking.get("jam_mulai") or jadwal.get("jam_mulai")
        end = booking.get("jam_selesai") or jadwal.get("jam_selesai")
        slot = _slot_minutes(start, end)
        if slot and target[0] < slot[1] and target[1] > slot[0]:
            return str(start)[:5], str(end)[:5]

    return None


def generate_available_slots(
    day_schedule: dict,
    booked_sessions: list[dict],
    duration_minutes: int = 30,
    now: datetime | None = None,
) -> list[dict]:
    """Hasilkan daftar slot waktu untuk satu hari berdasarkan jadwal konsultan.

    Args:
        day_schedule: Dict jadwal dari tabel jadwal_ketersediaan (jam_mulai, jam_selesai, tanggal).
        booked_sessions: List booking aktif konsultan pada tanggal tersebut (jam_mulai, jam_selesai).
        duration_minutes: Durasi konsultasi yang diminta (kelipatan 30, default 30).
        now: Waktu sekarang dalam WIB (opsional, diambil otomatis jika None).

    Returns:
        List dict: [{ "start": "HH:MM", "end": "HH:MM", "label": "HH:MM - HH:MM", "status": "available"|"booked"|"disabled" }]
    """
    _now = now or now_wib()
    tanggal = str(day_schedule.get("tanggal", "")).split("T")[0]

    try:
        open_min = _to_minutes(str(day_schedule.get("jam_mulai", "00:00"))[:5])
        close_min = _to_minutes(str(day_schedule.get("jam_selesai", "23:59"))[:5])
    except (ValueError, IndexError):
        return []

    # Precompute booked intervals untuk tanggal ini
    booked_intervals: list[tuple[int, int]] = []
    for b in booked_sessions:
        b_date = str(b.get("tanggal_pengajuan", "")).split("T")[0]
        if b_date != tanggal:
            continue
        try:
            b_start = _to_minutes(str(b.get("jam_mulai", ""))[:5])
            b_end = _to_minutes(str(b.get("jam_selesai", ""))[:5])
            booked_intervals.append((b_start, b_end))
        except (ValueError, IndexError):
            continue

    # Tentukan menit sekarang jika tanggal hari ini
    today_str = _now.strftime("%Y-%m-%d")
    is_today = tanggal == today_str
    current_min = _now.hour * 60 + _now.minute if is_today else -1

    slots = []
    step = SESSION_MINUTES  # 30 menit
    m = open_min
    while m <= close_min - duration_minutes:
        end_m = m + duration_minutes
        start_str = f"{m // 60:02d}:{m % 60:02d}"
        end_str = f"{end_m // 60:02d}:{end_m % 60:02d}"

        if is_today and m <= current_min:
            status = "disabled"
        elif any(max(m, bs) < min(end_m, be) for bs, be in booked_intervals):
            status = "booked"
        else:
            status = "available"

        slots.append({
            "start": start_str,
            "end": end_str,
            "label": f"{start_str} - {end_str}",
            "status": status,
        })
        m += step

    return slots
