from urllib.parse import urlsplit

from core.exceptions import BadRequestError


def is_https_url(value: str | None) -> bool:
    if not value:
        return False
    parts = urlsplit(value.strip())
    return parts.scheme == "https" and bool(parts.netloc)


def ensure_https_url(value: str, detail: str) -> str:
    value = value.strip()
    if not is_https_url(value):
        raise BadRequestError(detail)
    return value
