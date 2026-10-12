import re

_UNSAFE_SEARCH = re.compile(r"[,()*%\\]")


def clean_search(text: str | None) -> str:
    """Buang karakter yang bermakna khusus di filter PostgREST dari kata kunci pencarian."""
    return _UNSAFE_SEARCH.sub(" ", text or "").strip()


def page_window(page: int | None, page_size: int) -> tuple[int | None, int | None]:
    """(offset, limit) untuk paginasi; (None, None) berarti semua baris."""
    if page is None:
        return None, None
    return (page - 1) * page_size, page_size


def with_pagination(payload: dict, total: int, page: int | None, page_size: int) -> dict:
    payload["total"] = total
    if page is not None:
        payload["page"] = page
        payload["page_size"] = page_size
    return payload
