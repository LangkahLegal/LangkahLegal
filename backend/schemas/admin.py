"""
Pydantic schemas untuk Admin Dashboard endpoints.
"""

from pydantic import BaseModel
from typing import Optional


class VerifyConsultantPayload(BaseModel):
    """Payload untuk approve/reject konsultan."""
    action: str
    alasan: Optional[str] = None
