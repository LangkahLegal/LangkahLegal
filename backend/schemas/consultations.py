from dataclasses import dataclass
from typing import Optional

from fastapi import File, Form, UploadFile
from pydantic import BaseModel, Field

from schemas.validation import MAX_LONG_TEXT, MAX_REVIEW, TIME_PATTERN


@dataclass
class ConsultationForm:
    id_jadwal: int = Form(...)
    deskripsi_kasus: str = Form(..., max_length=MAX_LONG_TEXT)
    jam_mulai: str = Form(..., pattern=TIME_PATTERN)
    jam_selesai: str = Form(..., pattern=TIME_PATTERN)
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None)


class AssignSchedule(BaseModel):
    id_jadwal: int = Field(..., description="ID slot jadwal ketersediaan milik konsultan")
    jam_mulai: str = Field(..., pattern=TIME_PATTERN, description="Jam mulai konsultasi, format HH:MM:SS")
    jam_selesai: str = Field(..., pattern=TIME_PATTERN, description="Jam selesai konsultasi, format HH:MM:SS")


class RatingCreate(BaseModel):
    skor_rating: int = Field(..., ge=1, le=5, description="Skor rating 1-5")
    ulasan_teks: Optional[str] = Field(None, max_length=MAX_REVIEW, description="Teks ulasan (opsional)")
