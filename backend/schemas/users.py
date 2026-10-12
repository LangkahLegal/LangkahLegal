from dataclasses import dataclass, fields

from fastapi import File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional

class ProfileUpdatePayload(BaseModel):
    nama: Optional[str] = None
    foto_profil: Optional[str] = None
    bio_singkat: Optional[str] = None
    deskripsi_lengkap: Optional[str] = None
    nomor_izin_praktik: Optional[str] = None
    gelar_akademik: Optional[str] = None
    pendidikan_terakhir: Optional[str] = None
    kota_praktik: Optional[str] = None
    spesialisasi: Optional[str] = None
    pengalaman_tahun: Optional[int] = None
    tarif_per_sesi: Optional[float] = None
    linkedin: Optional[str] = None
    portofolio: Optional[str] = None


@dataclass
class ProfileForm:
    nama: str | None = Form(default=None)
    foto_profil: str | None = Form(default=None)
    bio_singkat: str | None = Form(default=None)
    deskripsi_lengkap: str | None = Form(default=None)
    nomor_izin_praktik: str | None = Form(default=None)
    gelar_akademik: str | None = Form(default=None)
    pendidikan_terakhir: str | None = Form(default=None)
    kota_praktik: str | None = Form(default=None)
    spesialisasi: str | None = Form(default=None)
    pengalaman_tahun: int | None = Form(default=None)
    tarif_per_sesi: float | None = Form(default=None)
    linkedin: str | None = Form(default=None)
    portofolio: str | None = Form(default=None)
    portofolio_file: UploadFile | None = File(default=None)

    def to_payload(self) -> ProfileUpdatePayload:
        values = {
            field.name: getattr(self, field.name)
            for field in fields(self)
            if field.name != "portofolio_file"
        }
        return ProfileUpdatePayload.model_construct(**values)
