import re

_QUOTA_ID = re.compile(r"""['"]quotaId['"]:\s*['"]([^'"]+)['"]""")


def is_quota_error(error: Exception) -> bool:
    """429: kuota habis. Beda dengan 503 (server sibuk), retry beberapa detik kemudian tidak menolong."""
    return getattr(error, "code", None) == 429 or "RESOURCE_EXHAUSTED" in str(error)


def describe(error: Exception) -> str:
    """Ringkasan error Gemini untuk log. Untuk 429, sertakan quotaId supaya jelas limit mana yang habis
    (misalnya ...PerMinute... atau ...PerDay...)."""
    text = f"{type(error).__name__}: {str(error)[:150]}"
    quota_ids = sorted(set(_QUOTA_ID.findall(str(error))))
    return f"{text} [quota: {', '.join(quota_ids)}]" if quota_ids else text
