from typing import Optional

from pydantic import BaseModel


class ScheduleCreate(BaseModel):
    tanggal: str
    jam_mulai: str
    jam_selesai: str


class ScheduleUpdate(BaseModel):
    tanggal: Optional[str] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
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
