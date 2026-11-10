import logging
from contextvars import ContextVar
from uuid import uuid4

from fastapi import Request, Response

HEADER = "X-Request-ID"
_request_id: ContextVar[str] = ContextVar("request_id", default="-")


def request_id_sekarang() -> str:
    return _request_id.get()


async def pasang_request_id(request: Request, call_next) -> Response:
    """Setiap request mendapat ID yang muncul di log stdout, file log chatbot, dan header respons, supaya
    keluhan user bisa dicocokkan dengan log-nya."""
    masuk = request.headers.get(HEADER, "")
    rid = masuk if masuk.isalnum() and len(masuk) <= 64 else uuid4().hex
    token = _request_id.set(rid)
    try:
        response = await call_next(request)
    finally:
        _request_id.reset(token)
    response.headers[HEADER] = rid
    return response


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id.get()
        return True
