from typing import Optional

from pydantic import BaseModel, Field

from docs import schemas as docs
from schemas.validation import MAX_REASON


class VerifyConsultantPayload(BaseModel):
    __doc__ = docs.VERIFY_CONSULTANT_PAYLOAD
    action: str = Field(..., max_length=20)
    alasan: Optional[str] = Field(None, max_length=MAX_REASON)


class AdminStatsResponse(BaseModel):
    total_users: int
    total_clients: int
    total_consultants: int
    pending_verification: int
    total_transactions: Optional[int] = None
    total_revenue: float
    total_commission: float
