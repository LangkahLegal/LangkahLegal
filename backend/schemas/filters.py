from enum import Enum


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
