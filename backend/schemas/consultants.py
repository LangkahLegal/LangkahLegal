from pydantic import BaseModel
from typing import Optional

class ConsultantUpdate(BaseModel):
    nama_lengkap: Optional[str] = None 
    spesialisasi: Optional[str] = None 
    pengalaman_tahun: Optional[int] = None 
    tarif_per_sesi: Optional[float] = None 
    bio_singkat: Optional[str] = None 
    foto_profil: Optional[str] = None 
    
