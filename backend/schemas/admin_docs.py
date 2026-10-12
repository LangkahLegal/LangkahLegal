from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from docs import schemas as docs


class KategoriHukum(str, Enum):
    __doc__ = docs.KATEGORI_HUKUM
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
    __doc__ = docs.UPDATE_CHUNK_REQUEST
    kategori: Optional[KategoriHukum] = None
    isi_teks: Optional[str] = Field(None, min_length=10)




class ChunkResponse(BaseModel):
    __doc__ = docs.CHUNK_RESPONSE
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
    __doc__ = docs.DOCUMENT_GROUP_RESPONSE
    frbr_uri: str
    nama_uu: Optional[str] = None
    nomor_uu: Optional[str] = None
    tahun_uu: Optional[int] = None
    kategori: str
    status_hukum: Optional[str] = None
    total_chunks: int


class PaginatedResponse(BaseModel):
    __doc__ = docs.PAGINATED_RESPONSE
    data: list
    total: int
    page: int
    page_size: int


class JobStatusResponse(BaseModel):
    __doc__ = docs.JOB_STATUS_RESPONSE
    job_id: str
    status: str
    message: str
    frbr_uri: Optional[str] = None
    total_chunks: Optional[int] = None
    error: Optional[str] = None
