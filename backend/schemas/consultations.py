from pydantic import BaseModel
from typing import Optional

class ConsultationCreate(BaseModel):
    id_jadwal: int
    deskripsi_kasus: str
    
class ConsultationRespond(BaseModel):
    status_persetujuan: str # Isinya nanti 'disetujui' atau 'ditolak'
    
class ConsultationRating(BaseModel):
    rating: int
    ulasan: Optional[str] = None