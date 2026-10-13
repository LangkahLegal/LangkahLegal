from fastapi import Response

from core.config import get_settings

ROLE_COOKIE_MAX_AGE = 30 * 24 * 3600
REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60
OAUTH_VERIFIER_MAX_AGE = 3600


def get_cookie_flags() -> dict:
    settings = get_settings()
    is_production = settings.app_env.lower() == "production"
    cookie_domain = settings.cookie_domain.strip() or None

    return {
        "samesite": "none" if is_production else "lax",
        "secure": is_production,
        "domain": cookie_domain,
    }


def _set_http_only_cookie(response: Response, key: str, value: str, max_age: int) -> None:
    cookie_flags = get_cookie_flags()
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age,
        httponly=True,
        samesite=cookie_flags["samesite"],
        secure=cookie_flags["secure"],
        domain=cookie_flags["domain"],
        path="/",
    )


def set_auth_cookies(response: Response, session_data: dict) -> None:
    if not isinstance(session_data, dict):
        return

    access_token = session_data.get("access_token")
    refresh_token = session_data.get("refresh_token")
    expires_in = session_data.get("expires_in", 3600)

    if access_token:
        _set_http_only_cookie(response, "ll_token", access_token, expires_in)

    if refresh_token:
        _set_http_only_cookie(response, "ll_refresh", refresh_token, REFRESH_COOKIE_MAX_AGE)


def clear_auth_cookies(response: Response) -> None:
    domain = get_cookie_flags()["domain"]
    for key in ("ll_token", "ll_refresh", "ll_oauth_verifier", "ll_role"):
        response.delete_cookie(key, path="/", domain=domain)


def set_role_cookie(response: Response, role: str) -> None:
    response.set_cookie("ll_role", role, max_age=ROLE_COOKIE_MAX_AGE, path="/", samesite="lax")


def set_oauth_verifier_cookie(response: Response, code_verifier: str) -> None:
    _set_http_only_cookie(response, "ll_oauth_verifier", code_verifier, OAUTH_VERIFIER_MAX_AGE)


def clear_oauth_verifier_cookie(response: Response) -> None:
    response.delete_cookie("ll_oauth_verifier", path="/", domain=get_cookie_flags()["domain"])
