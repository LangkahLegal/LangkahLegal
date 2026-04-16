from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateTransactionRequest(BaseModel):
    id_pengajuan: int


class CreateTransactionResponse(BaseModel):
    snap_token: str
    redirect_url: str
    order_id: str


class PaymentStatusResponse(BaseModel):
    id_transaksi: int
    id_pengajuan: int
    order_id: str
    gross_amount: float
    status_pembayaran: str
    metode_pembayaran: Optional[str] = None
    waktu_bayar: Optional[datetime] = None
