from pydantic import BaseModel, Field
from typing import Optional

class CaseCreate(BaseModel):
    # Kita pakai str biasa lagi tanpa dropdown
    kategori_hukum: str = Field(..., example="pidana", description="Isi dengan: pidana, perdata, atau bisnis")
    deskripsi_kasus_awam: str = Field(..., example="Saya ditipu oleh rekan bisnis...")
    dokumen_bukti: Optional[str] = None

class BidCreate(BaseModel):
    pesan_tawaran: str
    estimasi_biaya: float