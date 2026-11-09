from dataclasses import dataclass
from enum import Enum
from typing import Optional

from fastapi import File, Form, Query, UploadFile

from schemas.filters import RENTANG_JADWAL_DESC, WAKTU_SESI_DESC, RentangJadwal, WaktuSesi
from schemas.validation import DATE_PATTERN, MAX_LONG_TEXT, MAX_URL, TIME_PATTERN


class DokumenBursa(str, Enum):
    SEMUA = "semua"
    ADA = "ada"
    TIDAK = "tidak"


class UrutanBursa(str, Enum):
    TERBARU = "terbaru"
    TERLAMA = "terlama"
    JADWAL_TERDEKAT = "jadwal_terdekat"


@dataclass
class CaseListFilters:
    kategori: Optional[str] = Query(None, max_length=50, description="Kategori hukum; kosong atau `semua` untuk semua")
    search: Optional[str] = Query(None, max_length=100, description="Kata kunci pada deskripsi kasus")
    jadwal: RentangJadwal = Query(RentangJadwal.SEMUA, description=RENTANG_JADWAL_DESC)
    waktu: WaktuSesi = Query(WaktuSesi.SEMUA, description=WAKTU_SESI_DESC)
    dokumen: DokumenBursa = Query(DokumenBursa.SEMUA, description="Ada tidaknya dokumen bukti")
    urutkan: UrutanBursa = Query(UrutanBursa.TERBARU, description="Urutan hasil")


@dataclass
class CaseForm:
    kategori_hukum: str = Form(..., max_length=50)
    deskripsi_kasus_awam: str = Form(..., max_length=MAX_LONG_TEXT)
    tanggal_konsultasi: str = Form(..., pattern=DATE_PATTERN)
    jam_mulai: str = Form(..., pattern=TIME_PATTERN)
    jam_selesai: str = Form(..., pattern=TIME_PATTERN)
    dokumen_bukti: Optional[str] = Form(default=None, max_length=MAX_URL)
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None)
