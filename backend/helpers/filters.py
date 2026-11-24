from datetime import timedelta

from helpers.listing import clean_search
from helpers.schedule import now_wib
from schemas.filters import (
    RentangJadwal,
    RentangRiwayat,
    RiwayatFilters,
    StatusRiwayat,
    SumberRiwayat,
    UrutanRiwayat,
    WaktuSesi,
)

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


# Rentang yang artinya sama dengan RentangJadwal; dihitung oleh date_range agar konsisten dengan daftar klien.
_RENTANG_BERSAMA = {
    RentangRiwayat.AKAN_DATANG,
    RentangRiwayat.HARI_INI,
    RentangRiwayat.BESOK,
    RentangRiwayat.TUJUH_HARI,
    RentangRiwayat.TIGA_PULUH_HARI,
    RentangRiwayat.SUDAH_LEWAT,
}


def riwayat_date_range(rentang: RentangRiwayat) -> tuple[str | None, str | None]:
    """Batas tanggal (dari, sebelum) ISO dari hari ini (WIB); batas atas eksklusif."""
    if rentang in _RENTANG_BERSAMA:
        return date_range(RentangJadwal(rentang.value))

    today = now_wib().date()
    tomorrow = (today + timedelta(days=1)).isoformat()

    if rentang == RentangRiwayat.TUJUH_HARI_TERAKHIR:
        return (today - timedelta(days=6)).isoformat(), tomorrow
    if rentang == RentangRiwayat.TIGA_PULUH_HARI_TERAKHIR:
        return (today - timedelta(days=29)).isoformat(), tomorrow
    if rentang == RentangRiwayat.BULAN_INI:
        first = today.replace(day=1)
        next_month = (first + timedelta(days=32)).replace(day=1)
        return first.isoformat(), next_month.isoformat()
    return None, None


def history_query_args(filters: RiwayatFilters) -> dict:
    """Ubah filter riwayat menjadi argumen repository; nilai None berarti tanpa pembatasan."""
    tanggal_dari, tanggal_sebelum = riwayat_date_range(filters.jadwal)
    jam_dari, jam_sebelum = time_range(filters.waktu)
    dari_bursa = {SumberRiwayat.BURSA: True, SumberRiwayat.KONSULTAN: False}.get(filters.sumber)

    return {
        "statuses": None if filters.status == StatusRiwayat.SEMUA else [filters.status.value],
        "search": clean_search(filters.search) or None,
        "tanggal_dari": tanggal_dari,
        "tanggal_sebelum": tanggal_sebelum,
        "jam_dari": jam_dari,
        "jam_sebelum": jam_sebelum,
        "dari_bursa": dari_bursa,
    }


def sort_by_schedule(rows: list[dict], tanggal_key: str, newest_first: bool) -> list[dict]:
    """Urutkan menurut tanggal lalu jam mulai; baris tanpa tanggal selalu di akhir."""
    dated = [row for row in rows if row.get(tanggal_key)]
    undated = [row for row in rows if not row.get(tanggal_key)]
    dated.sort(key=lambda row: (str(row[tanggal_key]), str(row.get("jam_mulai") or "")), reverse=newest_first)
    return dated + undated


def sort_by_created(rows: list[dict], newest_first: bool) -> list[dict]:
    """Urutkan menurut waktu pengajuan dibuat; baris tanpa created_at selalu di akhir."""
    dated = [row for row in rows if row.get("created_at")]
    undated = [row for row in rows if not row.get("created_at")]
    dated.sort(key=lambda row: str(row["created_at"]), reverse=newest_first)
    return dated + undated


def order_history(rows: list[dict], urutkan: UrutanRiwayat, tanggal_key: str) -> list[dict]:
    """Urutan selain bawaan: terbaru/terlama menurut waktu pengajuan, terdekat/terjauh menurut jadwal."""
    if urutkan in (UrutanRiwayat.TERBARU, UrutanRiwayat.TERLAMA):
        return sort_by_created(rows, newest_first=urutkan == UrutanRiwayat.TERBARU)
    return sort_by_schedule(rows, tanggal_key, newest_first=urutkan == UrutanRiwayat.JADWAL_TERJAUH)
