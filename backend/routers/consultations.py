from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from supabase import Client

from core.database import get_supabase_client
from core.dependencies import get_current_user
from core.user import CurrentUser
from docs import consultations as docs
from schemas.consultations import AssignSchedule, ConsultationForm, RatingCreate
from services import consultation_service

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, **docs.BUAT_PENGAJUAN_KONSULTASI)
async def buat_pengajuan_konsultasi(
    form: ConsultationForm = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return await consultation_service.create_consultation(db, current_user, form)


@router.put("/{id_pengajuan}/status")
def update_consultation_status(
    id_pengajuan: int,
    new_status: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.update_status(db, current_user, id_pengajuan, new_status)


@router.get("/", status_code=status.HTTP_200_OK, **docs.GET_MY_CONSULTATIONS)
def get_my_consultations(
    current_user: CurrentUser = Depends(get_current_user), db: Client = Depends(get_supabase_client)
):
    return consultation_service.list_my_consultations(db, current_user)


@router.get("/{id_pengajuan}", status_code=status.HTTP_200_OK, **docs.GET_DETAIL_PENGAJUAN)
def get_detail_pengajuan(
    id_pengajuan: int, current_user: CurrentUser = Depends(get_current_user), db: Client = Depends(get_supabase_client)
):
    return consultation_service.get_consultation_detail(db, current_user, id_pengajuan)


@router.put("/{id_pengajuan}/assign-schedule", **docs.ASSIGN_SCHEDULE_TO_CLAIM)
def assign_schedule_to_claim(
    id_pengajuan: int,
    request: AssignSchedule,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.assign_schedule(db, current_user, id_pengajuan, request)


@router.put("/{id_pengajuan}/zoom-link", **docs.UPDATE_ZOOM_LINK)
def update_zoom_link(
    id_pengajuan: int,
    link_zoom: str = Form(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.update_zoom_link(db, current_user, id_pengajuan, link_zoom)


@router.put("/{id_pengajuan}/complete", **docs.TANDAI_KONSULTASI_SELESAI)
def tandai_konsultasi_selesai(
    id_pengajuan: int, current_user: CurrentUser = Depends(get_current_user), db: Client = Depends(get_supabase_client)
):
    return consultation_service.mark_completed(db, current_user, id_pengajuan)


@router.get("/{id_konsultan}/booked-slots", status_code=status.HTTP_200_OK, **docs.GET_BOOKED_SLOTS)
def get_booked_slots(id_konsultan: int, db: Client = Depends(get_supabase_client)):
    return consultation_service.get_booked_slots(db, id_konsultan)


@router.get("/{id_pengajuan}/documents", status_code=status.HTTP_200_OK, **docs.GET_DOCUMENTS)
def get_documents(
    id_pengajuan: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.list_documents(db, current_user, id_pengajuan)


@router.post(
    "/{id_pengajuan}/documents",
    status_code=status.HTTP_201_CREATED,
    **docs.UPLOAD_DOCUMENT,
)
async def upload_document(
    id_pengajuan: int,
    dokumen_pendukung_files: list[UploadFile] = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return await consultation_service.upload_documents(db, current_user, id_pengajuan, dokumen_pendukung_files)


@router.delete(
    "/{id_pengajuan}/documents/{id_dokumen}",
    status_code=status.HTTP_200_OK,
    **docs.DELETE_DOCUMENT,
)
def delete_document(
    id_pengajuan: int,
    id_dokumen: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.delete_document(db, current_user, id_pengajuan, id_dokumen)


@router.post("/{id_pengajuan}/rating", **docs.SUBMIT_RATING)
def submit_rating(
    id_pengajuan: int,
    rating_data: RatingCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return consultation_service.submit_rating(db, current_user, id_pengajuan, rating_data)
