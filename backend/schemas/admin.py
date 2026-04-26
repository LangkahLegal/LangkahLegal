"""
Pydantic schemas untuk Admin Dashboard endpoints.
"""

from pydantic import BaseModel
from typing import Optional


class VerifyConsultantPayload(BaseModel):
    """Payload untuk approve/reject konsultan."""
    action: str  # 'terverifikasi' atau 'ditolak'
    alasan: Optional[str] = None  # Alasan jika ditolak
