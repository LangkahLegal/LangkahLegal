from typing import Optional

from pydantic import BaseModel

from docs import schemas as docs


class VerifyConsultantPayload(BaseModel):
    __doc__ = docs.VERIFY_CONSULTANT_PAYLOAD
    action: str
    alasan: Optional[str] = None


class AdminStatsResponse(BaseModel):
    total_users: int
    total_clients: int
    total_consultants: int
    pending_verification: int
    total_transactions: Optional[int] = None
    total_revenue: float
    total_commission: float
