from fastapi import APIRouter, Depends, Request, Response
from supabase import Client

from core.database import get_supabase_client
from core.dependencies import get_token_from_request
from core.limiter import limiter

from schemas.auth import (
    ForgotPasswordPayload,
    ResetPasswordPayload,
    OAuthPayload,
    OtpLoginPayload,
    PasswordLoginPayload,
    ResendOtpPayload,
    RolePayload,
    SignUpPayload,
    VerifyOtpPayload,
)
from services import auth_service
from helpers.cookies import (
    clear_auth_cookies,
    clear_oauth_verifier_cookie,
    set_auth_cookies,
    set_oauth_verifier_cookie,
    set_role_cookie,
)
from docs import auth as docs

router = APIRouter()


@router.post("/signup", **docs.SIGN_UP)
async def sign_up(payload: SignUpPayload, response: Response):
    data = await auth_service.sign_up(payload)
    set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post("/login-otp", **docs.SEND_OTP_LOGIN)
@limiter.limit("3/minute")
async def send_otp_login(request: Request, payload: OtpLoginPayload):
    return {"data": await auth_service.send_otp_login(payload)}


@router.post("/resend-signup-otp", **docs.RESEND_SIGNUP_OTP)
@limiter.limit("3/minute")
async def resend_signup_otp(request: Request, payload: ResendOtpPayload):
    return {"data": await auth_service.resend_signup_otp(payload)}


@router.post("/verify-otp", **docs.VERIFY_OTP)
async def verify_otp(payload: VerifyOtpPayload, response: Response):
    data = await auth_service.verify_otp(payload)
    set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post("/login-password", **docs.LOGIN_WITH_PASSWORD)
async def login_with_password(payload: PasswordLoginPayload, response: Response):
    data = await auth_service.login_with_password(payload)
    set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post("/oauth/google", **docs.SIGN_IN_WITH_GOOGLE)
async def sign_in_with_google(payload: OAuthPayload, response: Response):
    data = auth_service.build_google_oauth_url(payload)
    set_oauth_verifier_cookie(response, data["code_verifier"])
    return {"data": data}


@router.post("/exchange-code", **docs.EXCHANGE_CODE)
async def exchange_code(
    request: Request,
    response: Response,
    payload: dict,
):
    code = payload.get("code")
    code_verifier = payload.get("code_verifier") or request.cookies.get("ll_oauth_verifier")

    data = await auth_service.exchange_code(code, code_verifier)

    set_auth_cookies(response, data["session"])
    clear_oauth_verifier_cookie(response)

    return {"data": data}


@router.post("/refresh", **docs.REFRESH_SESSION)
async def refresh_session(request: Request, response: Response, payload: dict = None):
    refresh_token = request.cookies.get("ll_refresh")
    if payload and payload.get("refresh_token"):
        refresh_token = payload.get("refresh_token")

    data = await auth_service.refresh_session(refresh_token)

    set_auth_cookies(response, data["session"])

    return {"data": data}


@router.get("/profile", **docs.GET_PROFILE)
def get_profile(
    response: Response,
    token: str = Depends(get_token_from_request),
    db: Client = Depends(get_supabase_client),
):
    profile = auth_service.get_profile(db, token)
    if profile is not None:
        set_role_cookie(response, profile["role"])
    return {"data": profile}


@router.post("/role", **docs.UPDATE_ROLE)
def update_role(
    payload: RolePayload,
    response: Response,
    token: str = Depends(get_token_from_request),
    db: Client = Depends(get_supabase_client),
):
    data = auth_service.update_role(db, token, payload)
    set_role_cookie(response, payload.role)
    return {"data": data}


@router.post("/logout", **docs.LOGOUT)
async def logout(response: Response, token: str = Depends(get_token_from_request)):
    await auth_service.logout(token)
    clear_auth_cookies(response)
    return {"data": {"logout": True}}


@router.post("/forgot-password", **docs.FORGOT_PASSWORD)
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: ForgotPasswordPayload, response: Response):
    return {"data": await auth_service.forgot_password(payload)}


@router.post("/reset-password", **docs.RESET_PASSWORD)
async def reset_password(
    payload: ResetPasswordPayload,
    response: Response,
    token: str = Depends(get_token_from_request),
):
    await auth_service.reset_password(token, payload.new_password)
    clear_auth_cookies(response)
    return {"data": {"updated": True}}
