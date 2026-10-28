"""Preferensi konsultasi dari klien (budget dan waktu) diubah jadi nilai yang bisa dicocokkan dengan jadwal.

Gemini hanya mengisi nilai baku ("sabtu", "pagi"); tanggal sungguhan dihitung di sini supaya tidak salah hari.
"""

from datetime import date, timedelta

HARI_MINGGU = ("senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu")
PILIHAN_HARI = {
    "hari_ini": "Hari ini",
    "besok": "Besok",
    "lusa": "Lusa",
    "minggu_ini": "Minggu ini",
    "minggu_depan": "Minggu depan",
    "akhir_pekan": "Akhir pekan",
    "hari_kerja": "Hari kerja",
    **{h: h.capitalize() for h in HARI_MINGGU},
    "bebas": "Kapan saja",
}
# Rentang jam (menit sejak tengah malam) untuk mencocokkan jam mulai slot.
PILIHAN_WAKTU = {
    "pagi": ("Pagi (06.00-12.00)", 6 * 60, 12 * 60),
    "siang": ("Siang (12.00-15.00)", 12 * 60, 15 * 60),
    "sore": ("Sore (15.00-18.00)", 15 * 60, 18 * 60),
    "malam": ("Malam (18.00-22.00)", 18 * 60, 22 * 60),
    "bebas": ("Kapan saja", 0, 24 * 60),
}
JENDELA_HARI = 14


def tanggal_kandidat(hari: str | None, hari_ini: date) -> list[date]:
    """Tanggal yang sesuai preferensi hari, paling jauh JENDELA_HARI hari ke depan."""
    semua = [hari_ini + timedelta(days=i) for i in range(JENDELA_HARI)]
    if not hari or hari == "bebas":
        return semua
    if hari == "hari_ini":
        return [hari_ini]
    if hari == "besok":
        return [hari_ini + timedelta(days=1)]
    if hari == "lusa":
        return [hari_ini + timedelta(days=2)]
    if hari == "minggu_ini":
        return [d for d in semua if d <= hari_ini + timedelta(days=6 - hari_ini.weekday())]
    if hari == "minggu_depan":
        senin_depan = hari_ini + timedelta(days=7 - hari_ini.weekday())
        return [senin_depan + timedelta(days=i) for i in range(7)]
    if hari == "akhir_pekan":
        return [d for d in semua[:7] if d.weekday() >= 5]
    if hari == "hari_kerja":
        return [d for d in semua if d.weekday() < 5]
    if hari in HARI_MINGGU:
        return [d for d in semua if d.weekday() == HARI_MINGGU.index(hari)]
    return semua


def jendela_waktu(waktu: str | None) -> tuple[int, int]:
    _, mulai, selesai = PILIHAN_WAKTU.get(waktu or "bebas", PILIHAN_WAKTU["bebas"])
    return mulai, selesai


def rupiah(nilai: float | int | None) -> str:
    return "Rp" + f"{int(nilai or 0):,}".replace(",", ".")


def deskripsi_budget(budget_min: int | None, budget_max: int | None) -> str:
    if budget_min and budget_max:
        return f"{rupiah(budget_min)}-{rupiah(budget_max)}"
    if budget_max:
        return f"maksimal {rupiah(budget_max)}"
    if budget_min:
        return f"minimal {rupiah(budget_min)}"
    return ""


def deskripsi_waktu(hari: str | None, waktu: str | None) -> str:
    bagian = []
    if hari and hari != "bebas":
        bagian.append(PILIHAN_HARI.get(hari, hari).lower())
    if waktu and waktu != "bebas":
        bagian.append(waktu)
    return " ".join(bagian)


def label_slot(tanggal: date, mulai: str) -> str:
    nama_hari = HARI_MINGGU[tanggal.weekday()].capitalize()[:3]
    bulan = ("Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des")[tanggal.month - 1]
    return f"{nama_hari}, {tanggal.day} {bulan} · {mulai.replace(':', '.')}"
