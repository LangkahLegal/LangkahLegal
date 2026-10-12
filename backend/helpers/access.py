from supabase import Client

from core.exceptions import ForbiddenError, NotFoundError
from repositories import consultant_repository


def require_role(current_user: dict, role: str, detail: str) -> None:
    if current_user.get("role") != role:
        raise ForbiddenError(detail)


def get_konsultan_id(db: Client, id_user: int) -> int | None:
    return consultant_repository.get_id_by_user(db, id_user)


def require_konsultan_id(
    db: Client, id_user: int, detail: str = "Profil konsultan tidak ditemukan"
) -> int:
    id_konsultan = get_konsultan_id(db, id_user)
    if id_konsultan is None:
        raise NotFoundError(detail)
    return id_konsultan
