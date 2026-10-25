from core.constants import Role
from core.user import CurrentUser


def owns_consultation(current_user: CurrentUser, pengajuan: dict) -> bool:
    """Klien memiliki pengajuan yang ia buat; konsultan memiliki pengajuan yang ditujukan kepadanya.

    Peran sudah dibatasi router ke klien/konsultan, sehingga `id_konsultan` konsultan selalu terisi.
    """
    if current_user.role == Role.CLIENT:
        return pengajuan["id_user"] == current_user.id_user
    return pengajuan["id_konsultan"] == current_user.id_konsultan
