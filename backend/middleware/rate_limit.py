import time
from functools import lru_cache
from typing import Literal

from fastapi import Depends, Request
from limits import RateLimitItem, parse
from limits.storage import storage_from_string
from limits.strategies import MovingWindowRateLimiter

from core.exceptions import TooManyRequestsError
from core.user import CurrentUser
from middleware.session import get_current_user

STORAGE_URI = "memory://"
RETRY_MESSAGE = "Terlalu banyak permintaan. Mohon tunggu sebentar lalu coba lagi."


@lru_cache(maxsize=1)
def _limiter() -> MovingWindowRateLimiter:
    return MovingWindowRateLimiter(storage_from_string(STORAGE_URI))


@lru_cache(maxsize=32)
def _item(limit: str) -> RateLimitItem:
    return parse(limit)


def _retry_after(item: RateLimitItem, scope: str, key: str) -> str:
    reset_time = _limiter().get_window_stats(item, scope, key).reset_time
    return str(max(1, int(reset_time - time.time()) + 1))


def _hit(item: RateLimitItem, scope: str, key: str) -> None:
    if not _limiter().hit(item, scope, key):
        raise TooManyRequestsError(RETRY_MESSAGE, headers={"Retry-After": _retry_after(item, scope, key)})


def _route_scope(request: Request) -> str:
    route = request.scope.get("route")
    return f"{request.method} {getattr(route, 'path', request.url.path)}"


async def _email_from_body(request: Request) -> str | None:
    try:
        body = await request.json()
    except Exception:
        return None
    email = body.get("email") if isinstance(body, dict) else None
    return str(email).strip().lower() or None if email else None


def throttle(limit: str, *, by: Literal["user", "email"] = "user", scope: str | None = None):
    item = _item(limit)

    def bucket(request: Request) -> str:
        return scope or _route_scope(request)

    if by == "email":

        async def by_email(request: Request) -> None:
            email = await _email_from_body(request)
            if email:
                _hit(item, bucket(request), f"email:{email}")

        return by_email

    def by_user(request: Request, current_user: CurrentUser = Depends(get_current_user)) -> None:
        _hit(item, bucket(request), f"user:{current_user.id_user}")

    return by_user
