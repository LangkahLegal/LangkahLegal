from fastapi import APIRouter, Depends
from supabase import Client

from database import get_supabase_client
from dependencies import get_current_user
from schemas.admin import VerifyConsultantPayload
from services import admin_service
from docs import admin as docs

router = APIRouter()


@router.get("/stats", **docs.GET_ADMIN_STATS)
def get_admin_stats(
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.get_admin_stats(db, user)


@router.get("/consultants", **docs.GET_CONSULTANTS_LIST)
def get_consultants_list(
    status_filter: str = None,
    spesialisasi: str = None,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.list_consultants(db, user, status_filter, spesialisasi)


@router.get("/consultants/{id_konsultan}", **docs.GET_CONSULTANT_DETAIL)
def get_consultant_detail(
    id_konsultan: int,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.get_consultant_detail(db, user, id_konsultan)


@router.patch("/consultants/{id_konsultan}/verify", **docs.VERIFY_CONSULTANT)
def verify_consultant(
    id_konsultan: int,
    payload: VerifyConsultantPayload,
    user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return admin_service.verify_consultant(db, user, id_konsultan, payload)


