from dataclasses import dataclass
from enum import Enum
from typing import Optional

from fastapi import Query


class RentangJadwal(str, Enum):
    """Rentang tanggal konsultasi (WIB) untuk filter daftar."""

    SEMUA = "semua"
    AKAN_DATANG = "akan_datang"
    HARI_INI = "hari_ini"
    BESOK = "besok"
    TUJUH_HARI = "7_hari"
    TIGA_PULUH_HARI = "30_hari"
    SUDAH_LEWAT = "sudah_lewat"


class WaktuSesi(str, Enum):
    """Bagian hari dari jam mulai konsultasi."""

    SEMUA = "semua"
    PAGI = "pagi"
    SIANG = "siang"
    SORE = "sore"
    MALAM = "malam"


RENTANG_JADWAL_DESC = "Tanggal konsultasi (WIB): akan_datang, hari_ini, besok, 7_hari, 30_hari, sudah_lewat"
WAKTU_SESI_DESC = "Jam mulai: pagi < 12.00, siang 12.00-15.00, sore 15.00-18.00, malam >= 18.00"


class StatusRiwayat(str, Enum):
    """Nilainya sama dengan core.constants.StatusPengajuan, jadi dipakai langsung sebagai filter status."""

    SEMUA = "semua"
    PENDING = "pending"
    MENUNGGU_PEMBAYARAN = "menunggu_pembayaran"
    TERJADWAL = "terjadwal"
    SELESAI = "selesai"
    DIBATALKAN = "dibatalkan"
    DITOLAK = "ditolak"
    KEDALUWARSA = "kedaluwarsa"
    PEMBAYARAN_GAGAL = "pembayaran_gagal"


class RentangRiwayat(str, Enum):
    """Rentang tanggal konsultasi (WIB). Riwayat memuat sesi lampau maupun yang akan datang.

    Enam nilai pertama sama dengan RentangJadwal (daftar klien); sisanya khusus riwayat dan menghadap ke belakang.
    """

    SEMUA = "semua"
    AKAN_DATANG = "akan_datang"
    HARI_INI = "hari_ini"
    BESOK = "besok"
    TUJUH_HARI = "7_hari"
    TIGA_PULUH_HARI = "30_hari"
    SUDAH_LEWAT = "sudah_lewat"
    TUJUH_HARI_TERAKHIR = "7_hari_terakhir"
    TIGA_PULUH_HARI_TERAKHIR = "30_hari_terakhir"
    BULAN_INI = "bulan_ini"


class SumberRiwayat(str, Enum):
    SEMUA = "semua"
    KONSULTAN = "konsultan"  # dipesan langsung ke konsultan
    BURSA = "bursa"  # berasal dari Bursa Kasus


class UrutanRiwayat(str, Enum):
    BAWAAN = "bawaan"  # urutan lama: klien menurut status lalu terbaru, konsultan menurut jadwal terbaru
    TERBARU = "terbaru"  # waktu pengajuan dibuat
    TERLAMA = "terlama"
    JADWAL_TERDEKAT = "jadwal_terdekat"  # tanggal dan jam konsultasi, dari yang paling awal
    JADWAL_TERJAUH = "jadwal_terjauh"


RENTANG_RIWAYAT_DESC = (
    "Tanggal konsultasi (WIB): akan_datang, hari_ini, besok, 7_hari (ke depan), 30_hari (ke depan), sudah_lewat, "
    "7_hari_terakhir, 30_hari_terakhir, bulan_ini"
)


@dataclass
class RiwayatFilters:
    search: Optional[str] = Query(
        None, max_length=100, description="Kata kunci nama konsultan (untuk klien) atau nama klien (untuk konsultan)"
    )
    status: StatusRiwayat = Query(StatusRiwayat.SEMUA, description="Status pengajuan")
    jadwal: RentangRiwayat = Query(RentangRiwayat.SEMUA, description=RENTANG_RIWAYAT_DESC)
    waktu: WaktuSesi = Query(WaktuSesi.SEMUA, description=WAKTU_SESI_DESC)
    sumber: SumberRiwayat = Query(
        SumberRiwayat.SEMUA, description="Asal pengajuan: langsung ke konsultan atau Bursa Kasus"
    )
    urutkan: UrutanRiwayat = Query(UrutanRiwayat.BAWAAN, description="Urutan hasil")
