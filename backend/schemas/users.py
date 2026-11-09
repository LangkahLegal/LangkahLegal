from dataclasses import dataclass, fields
from typing import Optional

from fastapi import File, Form, UploadFile
from pydantic import BaseModel, Field

from schemas.validation import MAX_BIO, MAX_LONG_TEXT, MAX_NAME, MAX_SHORT_TEXT, MAX_URL


class ProfileUpdatePayload(BaseModel):
    nama: Optional[str] = Field(None, max_length=MAX_NAME)
    foto_profil: Optional[str] = Field(None, max_length=MAX_URL)
    bio_singkat: Optional[str] = Field(None, max_length=MAX_BIO)
    deskripsi_lengkap: Optional[str] = Field(None, max_length=MAX_LONG_TEXT)
    nomor_izin_praktik: Optional[str] = Field(None, max_length=MAX_NAME)
    gelar_akademik: Optional[str] = Field(None, max_length=MAX_NAME)
    pendidikan_terakhir: Optional[str] = Field(None, max_length=MAX_SHORT_TEXT)
    kota_praktik: Optional[str] = Field(None, max_length=MAX_NAME)
    spesialisasi: Optional[str] = Field(None, max_length=MAX_SHORT_TEXT)
    pengalaman_tahun: Optional[int] = None
    tarif_per_sesi: Optional[float] = None
    linkedin: Optional[str] = Field(None, max_length=MAX_URL)
    portofolio: Optional[str] = Field(None, max_length=MAX_URL)


@dataclass
class ProfileForm:
    nama: str | None = Form(default=None, max_length=MAX_NAME)
    foto_profil: str | None = Form(default=None, max_length=MAX_URL)
    bio_singkat: str | None = Form(default=None, max_length=MAX_BIO)
    deskripsi_lengkap: str | None = Form(default=None, max_length=MAX_LONG_TEXT)
    nomor_izin_praktik: str | None = Form(default=None, max_length=MAX_NAME)
    gelar_akademik: str | None = Form(default=None, max_length=MAX_NAME)
    pendidikan_terakhir: str | None = Form(default=None, max_length=MAX_SHORT_TEXT)
    kota_praktik: str | None = Form(default=None, max_length=MAX_NAME)
    spesialisasi: str | None = Form(default=None, max_length=MAX_SHORT_TEXT)
    pengalaman_tahun: int | None = Form(default=None)
    tarif_per_sesi: float | None = Form(default=None)
    linkedin: str | None = Form(default=None, max_length=MAX_URL)
    portofolio: str | None = Form(default=None, max_length=MAX_URL)
    portofolio_file: UploadFile | None = File(default=None)
    foto_profil_file: UploadFile | None = File(default=None)

    def to_payload(self) -> ProfileUpdatePayload:
        excluded = {"portofolio_file", "foto_profil_file"}
        values = {field.name: getattr(self, field.name) for field in fields(self) if field.name not in excluded}
        return ProfileUpdatePayload.model_construct(**values)
