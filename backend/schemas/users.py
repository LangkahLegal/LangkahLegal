from pydantic import BaseModel, Field
from typing import Optional

class ProfileUpdatePayload(BaseModel):
    nama: Optional[str] = None
    # Field khusus Konsultan
    nama_lengkap: Optional[str] = None
    kota_praktik: Optional[str] = None
    spesialisasi: Optional[str] = None
    pengalaman_tahun: Optional[int] = None
    tarif_per_sesi: Optional[float] = None
    linkedin: Optional[str] = None
    portofolio: Optional[str] = None # <--- Pakai nama asli dari database.sql
    avatar: Optional[str] = None # Masih dipetakan ke foto_profil di users