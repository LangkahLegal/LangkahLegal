from dataclasses import dataclass
from enum import Enum
from typing import Optional

from fastapi import File, Form, Query, UploadFile


class JadwalBursa(str, Enum):
    SEMUA = "semua"
    AKAN_DATANG = "akan_datang"
    HARI_INI = "hari_ini"
    BESOK = "besok"
    TUJUH_HARI = "7_hari"
    TIGA_PULUH_HARI = "30_hari"


class WaktuBursa(str, Enum):
    SEMUA = "semua"
    PAGI = "pagi"
    SIANG = "siang"
    SORE = "sore"
    MALAM = "malam"


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
    jadwal: JadwalBursa = Query(JadwalBursa.SEMUA, description="Rentang tanggal konsultasi (WIB)")
    waktu: WaktuBursa = Query(
        WaktuBursa.SEMUA,
        description="Jam mulai: pagi < 12.00, siang 12.00-15.00, sore 15.00-18.00, malam >= 18.00",
    )
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
