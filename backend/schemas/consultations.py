from datetime import datetime

from pydantic import BaseModel, Field
from typing import Optional

class ConsultationCreate(BaseModel):
    id_jadwal: int
    deskripsi_kasus: str
    jam_mulai: datetime
    jam_selesai: datetime
    
class ConsultationRespond(BaseModel):
    status_persetujuan: str = Field(..., description="Isi dengan 'disetujui' atau 'ditolak'")
    
class RatingCreate(BaseModel):
    skor: int = Field(..., ge=1, le=5, description="Skor bintang dari 1 sampai 5")
    ulasan: Optional[str] = None # Dibuat opsional jaga-jaga kalau klien hanya kasih bintang tanpa teks

class AssignSchedule(BaseModel):
    id_jadwal: int = Field(..., description="ID slot jadwal ketersediaan milik konsultan")
    jam_mulai: str = Field(..., description="Jam mulai konsultasi, format HH:MM:SS")
    jam_selesai: str = Field(..., description="Jam selesai konsultasi, format HH:MM:SS")