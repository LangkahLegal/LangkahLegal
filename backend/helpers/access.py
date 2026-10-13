from supabase import Client

from core.exceptions import ForbiddenError, NotFoundError
from core.user import CurrentUser
from repositories import consultant_repository


def require_role(current_user: CurrentUser, role: str, detail: str) -> None:
    if current_user.role != role:
        raise ForbiddenError(detail)


def get_konsultan_id(db: Client, current_user: CurrentUser) -> int | None:
    if current_user.id_konsultan is not None:
        return current_user.id_konsultan
    return consultant_repository.get_id_by_user(db, current_user.id_user)


def require_konsultan_id(
    db: Client, current_user: CurrentUser, detail: str = "Profil konsultan tidak ditemukan"
) -> int:
    id_konsultan = get_konsultan_id(db, current_user)
    if id_konsultan is None:
        raise NotFoundError(detail)
    return id_konsultan
