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