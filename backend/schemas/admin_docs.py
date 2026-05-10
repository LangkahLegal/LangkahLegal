"""Pydantic schemas untuk Admin Document Management (CRUD dokumen hukum)."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class KategoriHukum(str, Enum):
    """Enum sesuai kategori_hukum_enum di database Supabase."""
    pidana = "pidana"
    perdata = "perdata"
    agama = "agama"
    umum = "umum"
    ketenagakerjaan = "ketenagakerjaan"
    perusahaan = "perusahaan"
    konsumen = "konsumen"
    pajak = "pajak"
    internasional = "internasional"
    tata_usaha_negara = "tata_usaha_negara"
    lingkungan = "lingkungan"
    hak_asasi_manusia = "hak_asasi_manusia"
    kesehatan = "kesehatan"
    teknologi_informasi = "teknologi_informasi"
    kekayaan_intelektual = "kekayaan_intelektual"
    maritim = "maritim"
    agraria = "agraria"
    lainnya = "lainnya"


# ── Request Schemas ─────────────────────────────────────

class CreateChunkRequest(BaseModel):
    """Payload untuk menambah 1 chunk/pasal baru ke dokumen hukum."""
    frbr_uri: str = Field(..., example="/akn/id/act/uu-1-2024")
    node_id: str = Field(..., example="pasal_372")
    node_type: Optional[str] = Field("pasal", example="pasal")
    kategori: KategoriHukum
    nama_uu: Optional[str] = Field(None, example="Undang-Undang Hukum Pidana")
    nomor_uu: Optional[str] = Field(None, example="UU No. 1 Tahun 2024")
    tahun_uu: Optional[int] = Field(None, example=2024)
    status_hukum: Optional[str] = Field("berlaku", example="berlaku")
    sumber_undang_undang: str = Field(..., example="jdih.kemenkumham.go.id")
    pasal_bagian: str = Field(..., example="Pasal 372")
    judul_bab: Optional[str] = Field(None, example="BAB XXIV Penggelapan")
    isi_teks: str = Field(..., min_length=10, example="Barang siapa dengan sengaja...")


class UpdateChunkRequest(BaseModel):
    """Payload untuk update chunk/pasal. Field yang di-set = yang diubah."""
    kategori: Optional[KategoriHukum] = None
    nama_uu: Optional[str] = None
    nomor_uu: Optional[str] = None
    tahun_uu: Optional[int] = None
    status_hukum: Optional[str] = None
    pasal_bagian: Optional[str] = None
    judul_bab: Optional[str] = None
    isi_teks: Optional[str] = Field(None, min_length=10)


class BulkCreateRequest(BaseModel):
    """Payload untuk insert banyak chunk sekaligus (1 UU penuh)."""
    chunks: list[CreateChunkRequest] = Field(..., min_length=1)


# ── Response Schemas ────────────────────────────────────

class ChunkResponse(BaseModel):
    """Response untuk 1 chunk/pasal (tanpa embedding)."""
    id_dokumen: int
    frbr_uri: str
    node_id: str
    node_type: Optional[str] = None
    kategori: str
    nama_uu: Optional[str] = None
    nomor_uu: Optional[str] = None
    tahun_uu: Optional[int] = None
    status_hukum: Optional[str] = None
    sumber_undang_undang: str
    pasal_bagian: str
    judul_bab: Optional[str] = None
    isi_teks: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class DocumentGroupResponse(BaseModel):
    """Response ringkasan 1 UU (group by frbr_uri)."""
    frbr_uri: str
    nama_uu: Optional[str] = None
    nomor_uu: Optional[str] = None
    tahun_uu: Optional[int] = None
    kategori: str
    status_hukum: Optional[str] = None
    total_chunks: int


class PaginatedResponse(BaseModel):
    """Wrapper response dengan pagination."""
    data: list
    total: int
    page: int
    page_size: int
