from pydantic import BaseModel
from typing import Optional
from docs import schemas as docs


class VerifyConsultantPayload(BaseModel):
    __doc__ = docs.VERIFY_CONSULTANT_PAYLOAD
    action: str
    alasan: Optional[str] = None
