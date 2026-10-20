from dataclasses import dataclass
from enum import Enum
from typing import Optional

from fastapi import File, Form, Query, UploadFile

from schemas.filters import RENTANG_JADWAL_DESC, WAKTU_SESI_DESC, RentangJadwal, WaktuSesi


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
    kategori_hukum: str = Form(...)
    deskripsi_kasus_awam: str = Form(...)
    tanggal_konsultasi: str = Form(...)
    jam_mulai: str = Form(...)
    jam_selesai: str = Form(...)
    dokumen_bukti: Optional[str] = Form(default=None)
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None)
