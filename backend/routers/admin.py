from fastapi import APIRouter, Depends
from supabase import Client

from core.database import get_supabase_client
from core.dependencies import get_current_user
from core.user import CurrentUser
from docs import admin as docs
from schemas.admin import AdminStatsResponse, VerifyConsultantPayload
from services import admin_service

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse, **docs.GET_ADMIN_STATS)
def get_admin_stats(
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.get_admin_stats(db, user)


@router.get("/consultants", **docs.GET_CONSULTANTS_LIST)
def get_consultants_list(
    status_filter: str = None,
    spesialisasi: str = None,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.list_consultants(db, user, status_filter, spesialisasi)


@router.get("/consultants/{id_konsultan}", **docs.GET_CONSULTANT_DETAIL)
def get_consultant_detail(
    id_konsultan: int,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.get_consultant_detail(db, user, id_konsultan)


@router.patch("/consultants/{id_konsultan}/verify", **docs.VERIFY_CONSULTANT)
def verify_consultant(
    id_konsultan: int,
    payload: VerifyConsultantPayload,
    user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.verify_consultant(db, user, id_konsultan, payload)
