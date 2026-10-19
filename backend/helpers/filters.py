from datetime import timedelta

from helpers.schedule import now_wib
from schemas.filters import RentangJadwal, WaktuSesi

# Selisih hari dari hari ini (awal, akhir), inklusif; None berarti tanpa batas.
_OFFSET_HARI = {
    RentangJadwal.AKAN_DATANG: (0, None),
    RentangJadwal.HARI_INI: (0, 0),
    RentangJadwal.BESOK: (1, 1),
    RentangJadwal.TUJUH_HARI: (0, 6),
    RentangJadwal.TIGA_PULUH_HARI: (0, 29),
    RentangJadwal.SUDAH_LEWAT: (None, -1),
}

# Batas jam mulai (dari, sebelum); None berarti tanpa batas.
_JAM = {
    WaktuSesi.PAGI: (None, "12:00"),
    WaktuSesi.SIANG: ("12:00", "15:00"),
    WaktuSesi.SORE: ("15:00", "18:00"),
    WaktuSesi.MALAM: ("18:00", None),
}


def date_range(rentang: RentangJadwal) -> tuple[str | None, str | None]:
    """Batas tanggal (dari, sebelum) dalam format ISO, dihitung dari hari ini (WIB).

    Batas atas eksklusif (hari setelah tanggal terakhir) agar kolom timestamp yang punya jam ikut tercakup.
    """
    if rentang not in _OFFSET_HARI:
        return None, None
    today = now_wib().date()
    first, last = _OFFSET_HARI[rentang]
    since = None if first is None else (today + timedelta(days=first)).isoformat()
    before = None if last is None else (today + timedelta(days=last + 1)).isoformat()
    return since, before


def time_range(waktu: WaktuSesi) -> tuple[str | None, str | None]:
    """Batas jam mulai (dari, sebelum) untuk bagian hari yang dipilih."""
    return _JAM.get(waktu, (None, None))
