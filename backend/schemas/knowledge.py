from typing import Optional

from pydantic import BaseModel

from docs import schemas as docs


class KnowledgeDocument(BaseModel):
    __doc__ = docs.KNOWLEDGE_DOCUMENT
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


class KnowledgeDocumentDetail(KnowledgeDocument):
    total_pasal: int


class KnowledgePasal(BaseModel):
    id_dokumen: int
    pasal_bagian: str
    judul_bab: Optional[str] = None
    isi_teks: str


class PasalDetailResponse(KnowledgePasal):
    document: KnowledgeDocument


class PasalListResponse(BaseModel):
    data: list[KnowledgePasal]
    total: int
    page: int
    page_size: int
