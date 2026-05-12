"""Pydantic schemas untuk Admin Document Management endpoints."""

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




class UpdateChunkRequest(BaseModel):
    """Payload untuk update 1 chunk/pasal (fix typo / kategori)."""
    kategori: Optional[KategoriHukum] = None
    isi_teks: Optional[str] = Field(None, min_length=10)




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


class JobStatusResponse(BaseModel):
    """Response untuk status background job (upload/replace PDF)."""
    job_id: str
    status: str  # queued, processing, completed, failed
    message: str
    frbr_uri: Optional[str] = None
    total_chunks: Optional[int] = None
    error: Optional[str] = None
