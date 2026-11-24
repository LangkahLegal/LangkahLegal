from dataclasses import dataclass
from enum import Enum
from typing import Optional

from fastapi import Query
from pydantic import BaseModel, Field

from schemas.filters import RENTANG_JADWAL_DESC, WAKTU_SESI_DESC, RentangJadwal, WaktuSesi
from schemas.validation import DATE_PATTERN, TIME_PATTERN


class ScheduleCreate(BaseModel):
    tanggal: str = Field(..., pattern=DATE_PATTERN)
    jam_mulai: str = Field(..., pattern=TIME_PATTERN)
    jam_selesai: str = Field(..., pattern=TIME_PATTERN)


class ScheduleUpdate(BaseModel):
    tanggal: Optional[str] = Field(None, pattern=DATE_PATTERN)
    jam_mulai: Optional[str] = Field(None, pattern=TIME_PATTERN)
    jam_selesai: Optional[str] = Field(None, pattern=TIME_PATTERN)
    status_tersedia: Optional[bool] = None


class ScheduleToggle(BaseModel):
    status_tersedia: bool


class ConsultantActiveToggle(BaseModel):
    is_active: bool


class ConsultantDashboardStats(BaseModel):
    total_income: float
    total_klien: int
    total_klien_aktif: int
    is_active: bool


class StatusKlien(str, Enum):
    SEMUA = "semua"
    TERJADWAL = "terjadwal"
    MENUNGGU_PEMBAYARAN = "menunggu_pembayaran"


class UrutanKlien(str, Enum):
    TERBARU = "terbaru"
    TERLAMA = "terlama"
    JADWAL_TERDEKAT = "jadwal_terdekat"
    JADWAL_TERJAUH = "jadwal_terjauh"


@dataclass
class ClientListFilters:
    search: Optional[str] = Query(None, max_length=100, description="Kata kunci nama klien")
    status: StatusKlien = Query(StatusKlien.SEMUA, description="Status pengajuan aktif")
    jadwal: RentangJadwal = Query(RentangJadwal.SEMUA, description=RENTANG_JADWAL_DESC)
    waktu: WaktuSesi = Query(WaktuSesi.SEMUA, description=WAKTU_SESI_DESC)
    urutkan: UrutanKlien = Query(UrutanKlien.TERBARU, description="Urutan menurut waktu pengajuan atau jadwal")
