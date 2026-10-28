from typing import Optional

from pydantic import BaseModel, Field

from docs import schemas as docs


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


class PreferensiKonsultasi(BaseModel):
    __doc__ = docs.PREFERENSI_KONSULTASI
    kategori: Optional[str] = Field(None, description="Kategori hukum pilihan klien, menimpa asumsi Kia")
    budget_min: Optional[int] = Field(None, ge=0, description="Budget minimal per sesi (rupiah)")
    budget_max: Optional[int] = Field(None, ge=0, description="Budget maksimal per sesi (rupiah)")
    hari: Optional[str] = Field(None, description="Nilai dari form_preferensi.pilihan_hari")
    waktu: Optional[str] = Field(None, description="Nilai dari form_preferensi.pilihan_waktu")
    dilewati: bool = Field(False, description="Klien memilih 'Lewati' dan ingin melihat semua konsultan")


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
    preferensi: Optional[PreferensiKonsultasi] = Field(
        None,
        description="Jawaban form budget dan jadwal, dikirim saat pesan AI terakhir bertipe 'tanya_preferensi'",
    )


class PasalReference(BaseModel):
    id_dokumen: Optional[int] = None
    frbr_uri: Optional[str] = None
    nama_uu: Optional[str] = ""
    nomor_uu: Optional[str] = ""
    pasal_bagian: str
    judul_bab: Optional[str] = None
    similarity: float


class SumberPasal(BaseModel):
    id_dokumen: int
    pasal_bagian: str
    similarity: float


class SumberDokumen(BaseModel):
    __doc__ = docs.SUMBER_DOKUMEN
    frbr_uri: str
    nama_uu: Optional[str] = None
    nomor_uu: Optional[str] = None
    tahun_uu: Optional[int] = None
    kategori: Optional[str] = None
    status_hukum: Optional[str] = None
    has_file: bool = False
    file_url: Optional[str] = None
    sumber_url: Optional[str] = None
    judul_resmi: Optional[str] = None
    pasal: list[SumberPasal] = []


class SlotKonsultan(BaseModel):
    tanggal: str = Field(..., description="YYYY-MM-DD")
    mulai: str = Field(..., description="HH:MM (WIB)")
    selesai: str = Field(..., description="HH:MM (WIB)")
    label: str = Field(..., description="Teks siap tampil, misalnya 'Sab, 31 Okt · 09.00'")


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
    jadwal_status: Optional[str] = Field(
        None,
        description=(
            "'cocok' (ada slot di waktu yang diminta), 'terdekat' (tidak ada, ditampilkan slot terdekat), "
            "'tersedia' (klien tidak menyebut waktu), atau 'belum_ada' (konsultan belum membuka jadwal)"
        ),
    )
    slot_cocok: list[SlotKonsultan] = []


class PilihanForm(BaseModel):
    nilai: str
    label: str


class FormPreferensi(BaseModel):
    __doc__ = docs.FORM_PREFERENSI
    kategori: str = Field(..., description="Kategori hukum yang diasumsikan Kia")
    pilihan_kategori: list[PilihanForm]
    pilihan_hari: list[PilihanForm]
    pilihan_waktu: list[PilihanForm]
    nilai_awal: dict = Field({}, description="Preferensi yang sudah disebut klien, untuk mengisi form di awal")


class DraftKonsultasi(BaseModel):
    __doc__ = docs.DRAFT_KONSULTASI
    kategori: str
    ringkasan_kasus: str
    bukti_dimiliki: list[str] = []
    bukti_perlu_disiapkan: list[str] = []
    deskripsi_kasus: str = Field(..., description="Teks siap pakai untuk mengisi deskripsi kasus di form pengajuan")


class TriageResponse(BaseModel):
    session_id: str
    type: str = Field(
        "text",
        description=(
            "'text' untuk jawaban biasa, 'consultant_list' untuk daftar konsultan, "
            "'consultation_draft' untuk draft pengajuan konsultasi beserta daftar konsultan, "
            "'tanya_preferensi' saat Kia menanyakan budget dan jadwal (tampilkan form_preferensi)"
        ),
    )
    jawaban: str
    pasal_referensi: list[PasalReference] = []
    sumber_dokumen: list[SumberDokumen] = []
    consultants: Optional[list[ConsultantInfo]] = None
    draft_konsultasi: Optional[DraftKonsultasi] = None
    form_preferensi: Optional[FormPreferensi] = None
    disclaimer: str
