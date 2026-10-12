import math

from core.exceptions import BadRequestError

SESSION_MINUTES = 30


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
        raise BadRequestError(
            f"Jam di luar rentang operasional ({jadwal['jam_mulai']} - {jadwal['jam_selesai']})"
        )
