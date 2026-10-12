from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from limiter import limiter
from schemas.knowledge import (
    KnowledgeDocumentDetail,
    PasalDetailResponse,
    PasalListResponse,
)
from services import knowledge_service
from docs import knowledge as docs

router = APIRouter()

RATE_LIMIT = "30/minute"


@router.get("/pasal/{id_dokumen}", response_model=PasalDetailResponse, **docs.GET_PASAL)
@limiter.limit(RATE_LIMIT)
def get_pasal(
    request: Request,
    id_dokumen: int,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.get_pasal(db, id_dokumen)


@router.get("/documents/detail", response_model=KnowledgeDocumentDetail, **docs.GET_DOCUMENT_DETAIL)
@limiter.limit(RATE_LIMIT)
def get_document_detail(
    request: Request,
    frbr_uri: str = Query(..., description="FRBR URI dokumen, misal /akn/id/act/uu-13-2003"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.get_document_detail(db, frbr_uri)


@router.get("/documents/pasal", response_model=PasalListResponse, **docs.LIST_DOCUMENT_PASAL)
@limiter.limit(RATE_LIMIT)
def list_document_pasal(
    request: Request,
    frbr_uri: str = Query(..., description="FRBR URI dokumen"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100, description="Cari nomor pasal atau isi teks"),
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.list_document_pasal(db, frbr_uri, page, page_size, search)
