from core.constants import Role
from core.user import CurrentUser


def owns_consultation(current_user: CurrentUser, pengajuan: dict) -> bool:
    if current_user.role == Role.CLIENT:
        return pengajuan["id_user"] == current_user.id_user
    return pengajuan["id_konsultan"] == current_user.id_konsultan
