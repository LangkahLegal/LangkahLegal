from fastapi import APIRouter, Depends, status
from supabase import Client

from core.database import get_supabase_client
from core.dependencies import get_current_user
from core.user import CurrentUser
from docs import cases as docs
from schemas.cases import CaseForm
from services import case_service

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, **docs.POSTING_KASUS_ANONIM)
async def posting_kasus_anonim(
    form: CaseForm = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return await case_service.post_case(db, current_user, form)


@router.get("/", **docs.LIHAT_BURSA_KASUS)
def lihat_bursa_kasus(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return case_service.list_open_cases(db, current_user)


@router.post("/{id_bursa}/claim", status_code=status.HTTP_201_CREATED, **docs.KLAIM_KASUS)
def klaim_kasus(
    id_bursa: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return case_service.claim_case(db, current_user, id_bursa)
