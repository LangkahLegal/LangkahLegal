"""Memilih konsultan untuk direkomendasikan chatbot berdasarkan kategori, budget, dan jadwal klien.

Hanya konsultan terverifikasi dan aktif yang dipertimbangkan (consultant_repository.list_recommendable). Kalau tidak
ada yang cocok sempurna, syarat dilonggarkan bertahap dan setiap pelonggaran ditandai supaya jawaban Kia bisa
menyampaikannya terus terang:
1. Kategori yang diminta kosong -> konsultan "Umum".
2. Tidak ada tarif dalam budget -> tampilkan tarif yang paling dekat dengan budget.
3. Tidak ada slot di hari/jam yang diminta -> tampilkan slot terdekat; tanpa jadwal sama sekali tetap ditampilkan
   dengan status "belum_ada".
"""

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Optional

from supabase import Client

from core.constants import StatusPengajuan
from helpers import preferensi as pref_helper
from helpers.rating import summarize_ratings
from helpers.schedule import generate_available_slots, now_wib
from repositories import consultant_repository, consultation_repository, schedule_repository

logger = logging.getLogger(__name__)

KATEGORI = ("Pidana", "Perdata", "Ketenagakerjaan", "Teknologi Informasi", "HAM", "Umum")
# Penulisan spesialisasi di data konsultan belum seragam ("Hukum Pidana", "Pidana").
_POLA_KATEGORI = {
    "Pidana": ("pidana",),
    "Perdata": ("perdata",),
    "Ketenagakerjaan": ("ketenagakerjaan", "perburuhan", "hubungan industrial"),
    "Teknologi Informasi": ("teknologi informasi", "siber", "telematika"),
    "HAM": ("hak asasi",),
    "Umum": ("umum",),
}
MAX_KONSULTAN = 3
MAX_SLOT_PER_KONSULTAN = 3
DURASI_SLOT_MENIT = 60
STATUS_BOOKING_AKTIF = (StatusPengajuan.TERJADWAL, StatusPengajuan.PENDING, StatusPengajuan.MENUNGGU_PEMBAYARAN)


def normalisasi_kategori(spesialisasi: Optional[str]) -> Optional[str]:
    teks = (spesialisasi or "").strip().lower()
    if teks == "ham":
        return "HAM"
    for kategori, pola in _POLA_KATEGORI.items():
        if any(p in teks for p in pola):
            return kategori
    return None


@dataclass
class HasilPencarian:
    konsultan: list[dict] = field(default_factory=list)
    kategori: str = "Umum"
    kategori_diminta: str = "Umum"
    kategori_cadangan: bool = False
    budget_dilonggarkan: bool = False
    # None: klien tidak menyebut hari/jam; True/False: ada konsultan dengan slot di waktu yang diminta.
    jadwal_cocok: Optional[bool] = None
    preferensi: dict = field(default_factory=dict)


def _ada_budget(pref: dict) -> bool:
    return bool(pref.get("budget_min") or pref.get("budget_max"))


def _dalam_budget(tarif, pref: dict) -> bool:
    if tarif is None:
        return False
    return (pref.get("budget_min") or 0) <= tarif <= (pref.get("budget_max") or float("inf"))


def _jarak_budget(tarif, pref: dict) -> float:
    if tarif is None:
        return float("inf")
    bawah, atas = pref.get("budget_min") or 0, pref.get("budget_max") or float("inf")
    return 0 if bawah <= tarif <= atas else min(abs(tarif - bawah), abs(tarif - atas))


def _slot_konsultan(
    jadwal: list[dict], booking: list[dict], tanggal_diminta: set[date], waktu: tuple[int, int], sekarang: datetime
) -> tuple[list[dict], list[dict]]:
    """(slot yang cocok dengan preferensi, slot tersedia paling awal), masing-masing paling banyak MAX_SLOT.

    Paling banyak satu slot per tanggal, supaya pilihan yang ditampilkan tersebar di hari yang berbeda.
    """
    cocok, terdekat = [], []
    for baris in jadwal:
        tanggal = date.fromisoformat(str(baris["tanggal"])[:10])
        slots = generate_available_slots(baris, booking, duration_minutes=DURASI_SLOT_MENIT, now=sekarang)
        for slot in slots:
            if slot["status"] != "available":
                continue
            item = {
                "tanggal": tanggal.isoformat(),
                "mulai": slot["start"],
                "selesai": slot["end"],
                "label": pref_helper.label_slot(tanggal, slot["start"]),
            }
            jam, menit = map(int, slot["start"].split(":"))
            sesuai = tanggal in tanggal_diminta and waktu[0] <= jam * 60 + menit < waktu[1]
            if sesuai and len(cocok) < MAX_SLOT_PER_KONSULTAN and all(s["tanggal"] != item["tanggal"] for s in cocok):
                cocok.append(item)
            if len(terdekat) < MAX_SLOT_PER_KONSULTAN and all(s["tanggal"] != item["tanggal"] for s in terdekat):
                terdekat.append(item)
        if len(cocok) >= MAX_SLOT_PER_KONSULTAN:
            break
    return cocok, terdekat


def _format_konsultan(row: dict) -> dict:
    rating, ulasan = summarize_ratings(row.get("rating_ulasan") or [])
    return {
        "id_konsultan": row["id_konsultan"],
        "nama_lengkap": row.get("nama_lengkap"),
        "spesialisasi": row.get("spesialisasi"),
        "tarif_per_sesi": row.get("tarif_per_sesi"),
        "kota_praktik": row.get("kota_praktik"),
        "pengalaman_tahun": row.get("pengalaman_tahun"),
        "bio_singkat": row.get("bio_singkat"),
        "foto_profil": (row.get("users") or {}).get("foto_profil"),
        "avg_rating": rating,
        "total_reviews": ulasan,
    }


def cari_konsultan(
    db: Client,
    kategori: Optional[str],
    pref: Optional[dict] = None,
    kota: Optional[str] = None,
    sekarang: Optional[datetime] = None,
) -> HasilPencarian:
    pref = {} if not pref or pref.get("dilewati") else dict(pref)
    kategori = kategori if kategori in KATEGORI else "Umum"
    hasil = HasilPencarian(kategori=kategori, kategori_diminta=kategori, preferensi=pref)

    semua = consultant_repository.list_recommendable(db)
    kandidat = []
    for kat in dict.fromkeys((kategori, "Umum")):
        kandidat = [r for r in semua if normalisasi_kategori(r.get("spesialisasi")) == kat]
        if kandidat:
            hasil.kategori, hasil.kategori_cadangan = kat, kat != kategori
            break
    if not kandidat:
        return hasil

    if _ada_budget(pref):
        dalam_budget = [r for r in kandidat if _dalam_budget(r.get("tarif_per_sesi"), pref)]
        if dalam_budget:
            kandidat = dalam_budget
        else:
            hasil.budget_dilonggarkan = True
            kandidat = sorted(kandidat, key=lambda r: _jarak_budget(r.get("tarif_per_sesi"), pref))[: MAX_KONSULTAN * 2]

    sekarang = sekarang or now_wib()
    hari_ini = sekarang.date()
    tanggal_diminta = set(pref_helper.tanggal_kandidat(pref.get("hari"), hari_ini))
    waktu = pref_helper.jendela_waktu(pref.get("waktu"))
    sampai = hari_ini + timedelta(days=pref_helper.JENDELA_HARI - 1)
    ids = [r["id_konsultan"] for r in kandidat]
    jadwal = schedule_repository.list_available_between(db, ids, hari_ini.isoformat(), sampai.isoformat())
    booking = consultation_repository.list_booked_slots_for_many(db, ids, list(STATUS_BOOKING_AKTIF))

    meminta_waktu = bool(
        (pref.get("hari") and pref["hari"] != "bebas") or (pref.get("waktu") and pref["waktu"] != "bebas")
    )
    terformat = []
    for row in kandidat:
        jadwal_ini = [j for j in jadwal if j["id_konsultan"] == row["id_konsultan"]]
        booking_ini = [b for b in booking if b["id_konsultan"] == row["id_konsultan"]]
        cocok, terdekat = _slot_konsultan(jadwal_ini, booking_ini, tanggal_diminta, waktu, sekarang)
        data = _format_konsultan(row)
        if not meminta_waktu:
            # Klien tidak menyebut hari/jam: yang ditampilkan sekadar slot paling awal yang tersedia.
            data.update({"jadwal_status": "tersedia" if terdekat else "belum_ada", "slot_cocok": terdekat})
        elif cocok:
            data.update({"jadwal_status": "cocok", "slot_cocok": cocok})
        elif terdekat:
            data.update({"jadwal_status": "terdekat", "slot_cocok": terdekat})
        else:
            data.update({"jadwal_status": "belum_ada", "slot_cocok": []})
        terformat.append(data)

    urutan_status = {"cocok": 0, "tersedia": 0, "terdekat": 1, "belum_ada": 2}
    kota_lower = (kota or "").strip().lower()
    terformat.sort(
        key=lambda c: (
            urutan_status[c["jadwal_status"]],
            0 if kota_lower and kota_lower in (c.get("kota_praktik") or "").lower() else 1,
            _jarak_budget(c.get("tarif_per_sesi"), pref),
            -(c.get("avg_rating") or 0),
        )
    )
    hasil.konsultan = terformat[:MAX_KONSULTAN]
    if meminta_waktu:
        hasil.jadwal_cocok = any(c["jadwal_status"] == "cocok" for c in hasil.konsultan)
    logger.info(
        f"[MATCHING] kategori={hasil.kategori} (diminta {kategori}) budget_longgar={hasil.budget_dilonggarkan} "
        f"jadwal_cocok={hasil.jadwal_cocok} -> {[c['nama_lengkap'] for c in hasil.konsultan]}"
    )
    return hasil
