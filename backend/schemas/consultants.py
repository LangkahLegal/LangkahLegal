from pydantic import BaseModel
from typing import Optional

class ScheduleCreate(BaseModel):
    tanggal: str
    jam_mulai: str
    jam_selesai: str

class ScheduleUpdate(BaseModel):
    tanggal: Optional[str] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    
class ScheduleToggle(BaseModel):
    status_tersedia: bool

class ConsultantActiveToggle(BaseModel):
    is_active: bool

