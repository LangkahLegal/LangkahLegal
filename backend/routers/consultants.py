from typing import Optional

from fastapi import APIRouter, Depends, status
from supabase import Client

from core.database import get_supabase_client
from core.dependencies import get_current_user
from core.user import CurrentUser
from docs import consultants as docs
from schemas.consultants import (
    ConsultantActiveToggle,
    ConsultantDashboardStats,
    ScheduleCreate,
    ScheduleToggle,
    ScheduleUpdate,
)
from services import consultant_service

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK, **docs.GET_ALL_CONSULTANTS)
def get_all_consultants(spesialisasi: Optional[str] = None, db: Client = Depends(get_supabase_client)):
    return consultant_service.list_active_consultants(db, spesialisasi)


@router.get("/me/schedules", **docs.GET_MY_SCHEDULES)
def get_my_schedules(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_my_schedules(db, current_user)


@router.get(
    "/me/dashboard-stats",
    response_model=ConsultantDashboardStats,
    status_code=status.HTTP_200_OK,
    **docs.GET_CONSULTANT_DASHBOARD_STATS,
)
def get_consultant_dashboard_stats(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_dashboard_stats(db, current_user)


@router.get("/me/requests/pending", **docs.GET_PENDING_REQUESTS)
def get_pending_requests(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_pending_requests(db, current_user)


@router.get("/me/requests/active", **docs.GET_ACTIVE_REQUESTS)
def get_active_requests(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_active_requests(db, current_user)


@router.get("/{id_konsultan}", status_code=status.HTTP_200_OK, **docs.GET_CONSULTANT_DETAIL)
def get_consultant_detail(id_konsultan: int, db: Client = Depends(get_supabase_client)):
    return consultant_service.get_consultant_detail(db, id_konsultan)


@router.get(
    "/{id_konsultan}/schedules",
    status_code=status.HTTP_200_OK,
    **docs.GET_CONSULTANT_SCHEDULES,
)
def get_consultant_schedules(id_konsultan: int, db: Client = Depends(get_supabase_client)):
    return consultant_service.get_available_schedules(db, id_konsultan)


@router.post("/schedules", status_code=status.HTTP_201_CREATED, **docs.UPLOAD_JADWAL_KONSULTAN)
def upload_jadwal_konsultan(
    request: ScheduleCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.create_schedule(db, current_user, request)


@router.delete(
    "/schedules/{id_jadwal}",
    status_code=status.HTTP_200_OK,
    **docs.HAPUS_JADWAL_KONSULTAN,
)
def hapus_jadwal_konsultan(
    id_jadwal: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.delete_schedule(db, current_user, id_jadwal)


@router.put("/schedules/{id_jadwal}", status_code=status.HTTP_200_OK, **docs.EDIT_JADWAL_KONSULTAN)
def edit_jadwal_konsultan(
    id_jadwal: int,
    request: ScheduleUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.update_schedule(db, current_user, id_jadwal, request)


@router.patch("/schedules/{id_jadwal}/toggle", **docs.TOGGLE_SCHEDULE_SLOT)
def toggle_schedule_slot(id_jadwal: int, payload: ScheduleToggle, db: Client = Depends(get_supabase_client)):
    return consultant_service.toggle_schedule_slot(db, id_jadwal, payload)


@router.patch("/me/active-status", **docs.TOGGLE_GLOBAL_ACTIVE)
def toggle_global_active(
    payload: ConsultantActiveToggle,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.toggle_global_active(db, current_user, payload)


@router.get("/me/clients", **docs.GET_DAFTAR_KLIEN)
def get_daftar_klien(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_scheduled_clients(db, current_user)


@router.get("/me/history", **docs.GET_RIWAYAT_KONSULTAN)
def get_riwayat_konsultan(
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultant_service.get_history(db, current_user)
