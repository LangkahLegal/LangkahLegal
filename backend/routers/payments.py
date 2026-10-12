from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from core.config import Settings, get_settings
from core.database import get_supabase_client
from core.dependencies import get_current_user
from schemas.payments import CreateTransactionRequest
from services import payment_service
from docs import payments as docs

router = APIRouter()


@router.post("/create-transaction", status_code=status.HTTP_201_CREATED, **docs.CREATE_TRANSACTION)
def create_transaction(
    payload: CreateTransactionRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    return payment_service.create_transaction(db, current_user, settings, payload)

@router.post("/notification", status_code=status.HTTP_200_OK, **docs.MIDTRANS_NOTIFICATION)
async def midtrans_notification(
    request: Request,
    db: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    try:
        notification_json = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    return payment_service.handle_notification(db, settings, notification_json)


@router.get("/status/{id_pengajuan}", status_code=status.HTTP_200_OK, **docs.GET_PAYMENT_STATUS)
def get_payment_status(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    return payment_service.get_payment_status(db, current_user, id_pengajuan)


@router.post("/sync/{id_pengajuan}", status_code=status.HTTP_200_OK, **docs.SYNC_PAYMENT_STATUS)
def sync_payment_status(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    return payment_service.sync_payment_status(db, current_user, settings, id_pengajuan)
