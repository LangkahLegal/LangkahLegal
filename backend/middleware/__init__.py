"""Lapisan middleware yang dipanggil controller lewat `Depends`.

- `session`: autentikasi, mengubah token (header `Authorization` atau cookie `ll_token`) menjadi `CurrentUser`.
- `authorization`: gerbang peran per endpoint (`require_client`, `require_konsultan`, `require_admin`, ...).
- `rate_limit`: pembatas laju per endpoint (`throttle("3/minute")`) dan batas global per IP.

Contoh di router:

    @router.get("/me/schedules")
    def get_my_schedules(current_user: CurrentUser = Depends(require_konsultan), ...): ...

    @router.post("/login-otp", dependencies=[Depends(throttle("3/minute"))])
    async def send_otp_login(payload: OtpLoginPayload): ...
"""

from middleware.authorization import (
    RoleRequired,
    require_admin,
    require_client,
    require_client_or_konsultan,
    require_konsultan,
)
from middleware.rate_limit import GlobalThrottleMiddleware, throttle
from middleware.session import get_current_user, get_token_from_request

__all__ = [
    "GlobalThrottleMiddleware",
    "RoleRequired",
    "get_current_user",
    "get_token_from_request",
    "require_admin",
    "require_client",
    "require_client_or_konsultan",
    "require_konsultan",
    "throttle",
]
