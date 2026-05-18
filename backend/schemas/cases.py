from pydantic import BaseModel, Field
from typing import Optional

class CaseCreate(BaseModel):
    kategori_hukum: str = Field(..., example="pidana", description="Isi dengan: pidana, perdata, atau bisnis")
    deskripsi_kasus_awam: str = Field(..., example="Saya ditipu oleh rekan bisnis...")
    dokumen_bukti: Optional[str] = None
    tanggal_konsultasi: str = Field(..., example="2026-05-20", description="Tanggal konsultasi yang diinginkan (YYYY-MM-DD)")
    jam_mulai: str = Field(..., example="09:00", description="Jam mulai konsultasi (HH:MM)")
    jam_selesai: str = Field(..., example="10:00", description="Jam selesai konsultasi (HH:MM)")