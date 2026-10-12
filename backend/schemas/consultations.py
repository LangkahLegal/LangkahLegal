from dataclasses import dataclass
from datetime import datetime

from fastapi import File, Form, UploadFile
from pydantic import BaseModel, Field
from typing import Optional


@dataclass
class ConsultationForm:
    id_jadwal: int = Form(...)
    deskripsi_kasus: str = Form(...)
    jam_mulai: str = Form(...)
    jam_selesai: str = Form(...)
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None)


class ConsultationCreate(BaseModel):
    id_jadwal: int
    deskripsi_kasus: str
    jam_mulai: datetime
    jam_selesai: datetime
    
class ConsultationRespond(BaseModel):
    status_persetujuan: str = Field(..., description="Isi dengan 'disetujui' atau 'ditolak'")
    

class AssignSchedule(BaseModel):
    id_jadwal: int = Field(..., description="ID slot jadwal ketersediaan milik konsultan")
    jam_mulai: str = Field(..., description="Jam mulai konsultasi, format HH:MM:SS")
    jam_selesai: str = Field(..., description="Jam selesai konsultasi, format HH:MM:SS")

class RatingCreate(BaseModel):
    skor_rating: int = Field(..., ge=1, le=5, description="Skor rating 1-5")
    ulasan_teks: Optional[str] = Field(None, description="Teks ulasan (opsional)")