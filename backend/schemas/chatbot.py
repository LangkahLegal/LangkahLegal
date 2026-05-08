from typing import Optional
from pydantic import BaseModel, Field

class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field(
        "Sesi Konsultasi Baru",
        max_length=100,
        description="Judul sesi (opsional, bisa di-auto-generate dari pesan pertama)",
    )

class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str

class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]

class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    metadata: Optional[dict] = None
    created_at: str

class MessageListResponse(BaseModel):
    messages: list[MessageResponse]

class TriageRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Pertanyaan hukum dari pengguna",
        examples=["Apa hukuman untuk pencurian?"],
    )
    session_id: Optional[str] = Field(
        None,
        description="ID sesi. Jika null, backend akan membuat sesi baru secara otomatis.",
    )
    kategori: Optional[str] = Field(
        None,
        description="Filter kategori hukum (opsional)",
    )

class PasalReference(BaseModel):
    nama_uu: Optional[str] = ""
    nomor_uu: Optional[str] = ""
    pasal_bagian: str
    judul_bab: Optional[str] = None
    similarity: float

class ConsultantInfo(BaseModel):
    id_konsultan: int
    nama_lengkap: Optional[str] = None
    spesialisasi: Optional[str] = None
    tarif_per_sesi: Optional[float] = None
    kota_praktik: Optional[str] = None
    pengalaman_tahun: Optional[int] = None
    foto_profil: Optional[str] = None
    bio_singkat: Optional[str] = None
    avg_rating: Optional[float] = 0
    total_reviews: Optional[int] = 0

class TriageResponse(BaseModel):
    session_id: str
    type: str = Field("text", description="'text' untuk jawaban biasa, 'consultant_list' untuk daftar konsultan")
    jawaban: str
    pasal_referensi: list[PasalReference] = []
    consultants: Optional[list[ConsultantInfo]] = None
    disclaimer: str
