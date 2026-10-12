from pydantic import BaseModel


class CreateTransactionRequest(BaseModel):
    id_pengajuan: int


class CreateTransactionResponse(BaseModel):
    snap_token: str
    redirect_url: str
    order_id: str
