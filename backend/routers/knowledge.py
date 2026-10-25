from typing import Optional

from fastapi import APIRouter, Depends, Query
from supabase import Client

from core.database import get_supabase_client
from core.user import CurrentUser
from docs import knowledge as docs
from middleware import get_current_user, throttle
from schemas.knowledge import (
    KnowledgeDocumentDetail,
    PasalDetailResponse,
    PasalListResponse,
)
from services import knowledge_service

router = APIRouter()

RATE_LIMIT = "30/minute"
THROTTLED = [Depends(throttle(RATE_LIMIT, per_user=True))]


@router.get("/pasal/{id_dokumen}", response_model=PasalDetailResponse, dependencies=THROTTLED, **docs.GET_PASAL)
def get_pasal(
    id_dokumen: int,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.get_pasal(db, id_dokumen)


@router.get(
    "/documents/detail", response_model=KnowledgeDocumentDetail, dependencies=THROTTLED, **docs.GET_DOCUMENT_DETAIL
)
def get_document_detail(
    frbr_uri: str = Query(..., description="FRBR URI dokumen, misal /akn/id/act/uu-13-2003"),
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.get_document_detail(db, frbr_uri)


@router.get("/documents/pasal", response_model=PasalListResponse, dependencies=THROTTLED, **docs.LIST_DOCUMENT_PASAL)
def list_document_pasal(
    frbr_uri: str = Query(..., description="FRBR URI dokumen"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100, description="Cari nomor pasal atau isi teks"),
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return knowledge_service.list_document_pasal(db, frbr_uri, page, page_size, search)
