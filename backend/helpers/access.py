from supabase import Client

from core.exceptions import ForbiddenError, NotFoundError


def require_role(current_user: dict, role: str, detail: str) -> None:
    if current_user.get("role") != role:
        raise ForbiddenError(detail)


def get_konsultan_id(db: Client, id_user: int) -> int | None:
    result = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", id_user)
        .limit(1)
        .execute()
    )
    return result.data[0]["id_konsultan"] if result.data else None


def require_konsultan_id(
    db: Client, id_user: int, detail: str = "Profil konsultan tidak ditemukan"
) -> int:
    id_konsultan = get_konsultan_id(db, id_user)
    if id_konsultan is None:
        raise NotFoundError(detail)
    return id_konsultan
