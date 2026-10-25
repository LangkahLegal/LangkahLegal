import time
from functools import lru_cache

from fastapi import Depends, Request
from limits import RateLimitItem, parse
from limits.storage import storage_from_string
from limits.strategies import MovingWindowRateLimiter
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from core.exceptions import TooManyRequestsError
from core.user import CurrentUser
from middleware.session import get_current_user

STORAGE_URI = "memory://"
GLOBAL_LIMIT: str | None = "1000/minute"
GLOBAL_SCOPE = "global"
UNLIMITED_PATHS = {"/health"}
RETRY_MESSAGE = "Terlalu banyak permintaan. Mohon tunggu sebentar lalu coba lagi."


@lru_cache(maxsize=1)
def _limiter() -> MovingWindowRateLimiter:
    return MovingWindowRateLimiter(storage_from_string(STORAGE_URI))


@lru_cache(maxsize=32)
def _item(limit: str) -> RateLimitItem:
    return parse(limit)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.rsplit(",", 1)[-1].strip()
    return request.client.host if request.client else "unknown"


def _retry_after(item: RateLimitItem, scope: str, key: str) -> str:
    reset_time = _limiter().get_window_stats(item, scope, key).reset_time
    return str(max(1, int(reset_time - time.time()) + 1))


def _hit(item: RateLimitItem, scope: str, key: str) -> None:
    if not _limiter().hit(item, scope, key):
        raise TooManyRequestsError(RETRY_MESSAGE, headers={"Retry-After": _retry_after(item, scope, key)})


def _route_scope(request: Request) -> str:
    route = request.scope.get("route")
    return f"{request.method} {getattr(route, 'path', request.url.path)}"


def throttle(limit: str, *, per_user: bool = False, scope: str | None = None):
    item = _item(limit)

    def bucket(request: Request) -> str:
        return scope or _route_scope(request)

    if per_user:

        def by_user(request: Request, current_user: CurrentUser = Depends(get_current_user)) -> None:
            _hit(item, bucket(request), f"user:{current_user.id_user}")

        return by_user

    def by_ip(request: Request) -> None:
        _hit(item, bucket(request), f"ip:{client_ip(request)}")

    return by_ip


class GlobalThrottleMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not GLOBAL_LIMIT or request.method == "OPTIONS" or request.url.path in UNLIMITED_PATHS:
            return await call_next(request)

        item = _item(GLOBAL_LIMIT)
        key = f"ip:{client_ip(request)}"
        if not _limiter().hit(item, GLOBAL_SCOPE, key):
            return JSONResponse(
                status_code=429,
                content={"detail": RETRY_MESSAGE},
                headers={"Retry-After": _retry_after(item, GLOBAL_SCOPE, key)},
            )
        return await call_next(request)
