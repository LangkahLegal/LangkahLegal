"""Otorisasi: gerbang peran per endpoint. Pemeriksaan kepemilikan data tetap di service."""

from fastapi import Depends

from core.constants import Role
from core.exceptions import ForbiddenError, NotFoundError
from core.user import CurrentUser
from middleware.session import get_current_user


class RoleRequired:
    """Pengguna harus login dan berperan salah satu dari `roles`.

    Dipasang di router, mis. `current_user: CurrentUser = Depends(require_konsultan)`, sehingga
    service tidak perlu memeriksa peran lagi. Konsultan juga harus punya profil konsultan,
    jadi `current_user.id_konsultan` dijamin terisi saat sampai di service.
    """

    def __init__(self, *roles: str) -> None:
        self.roles = roles

    def __call__(self, current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in self.roles:
            raise ForbiddenError("Akses ditolak untuk peran akun Anda.")
        if current_user.role == Role.KONSULTAN and current_user.id_konsultan is None:
            raise NotFoundError("Profil konsultan tidak ditemukan. Pastikan Anda sudah terdaftar sebagai konsultan.")
        return current_user


require_client = RoleRequired(Role.CLIENT)
require_konsultan = RoleRequired(Role.KONSULTAN)
require_admin = RoleRequired(Role.ADMIN)
require_client_or_konsultan = RoleRequired(Role.CLIENT, Role.KONSULTAN)
