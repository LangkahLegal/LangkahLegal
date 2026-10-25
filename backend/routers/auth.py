from fastapi import APIRouter, Depends, Request, Response
from supabase import Client

from core.database import get_supabase_client
from docs import auth as docs
from helpers.cookies import (
    clear_auth_cookies,
    clear_oauth_verifier_cookie,
    set_auth_cookies,
    set_oauth_verifier_cookie,
    set_role_cookie,
)
from middleware import get_token_from_request, throttle
from schemas.auth import (
    ExchangeCodePayload,
    ForgotPasswordPayload,
    OAuthPayload,
    OtpLoginPayload,
    PasswordLoginPayload,
    RefreshTokenPayload,
    ResendOtpPayload,
    ResetPasswordPayload,
    RolePayload,
    SignUpPayload,
    VerifyOtpPayload,
)
from services import auth_service

router = APIRouter()


@router.post("/signup", **docs.SIGN_UP)
async def sign_up(payload: SignUpPayload, response: Response):
    data = await auth_service.sign_up(payload)
    set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post("/login-otp", dependencies=[Depends(throttle("3/minute", by="email"))], **docs.SEND_OTP_LOGIN)
async def send_otp_login(payload: OtpLoginPayload):
    return {"data": await auth_service.send_otp_login(payload)}


@router.post("/resend-signup-otp", dependencies=[Depends(throttle("3/minute", by="email"))], **docs.RESEND_SIGNUP_OTP)
async def resend_signup_otp(payload: ResendOtpPayload):
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
    payload: ExchangeCodePayload,
):
    code_verifier = payload.code_verifier or request.cookies.get("ll_oauth_verifier")

    data = await auth_service.exchange_code(payload.code, code_verifier)

    set_auth_cookies(response, data["session"])
    clear_oauth_verifier_cookie(response)

    return {"data": data}


@router.post("/refresh", **docs.REFRESH_SESSION)
async def refresh_session(request: Request, response: Response, payload: RefreshTokenPayload | None = None):
    refresh_token = (payload.refresh_token if payload else None) or request.cookies.get("ll_refresh")

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


@router.post("/forgot-password", dependencies=[Depends(throttle("3/minute", by="email"))], **docs.FORGOT_PASSWORD)
async def forgot_password(payload: ForgotPasswordPayload):
    return {"data": await auth_service.forgot_password(payload)}


@router.post("/reset-password", **docs.RESET_PASSWORD)
async def reset_password(
    payload: ResetPasswordPayload,
    response: Response,
    token: str = Depends(get_token_from_request),
):
    await auth_service.reset_password(token, payload.new_password, payload.current_password)
    clear_auth_cookies(response)
    return {"data": {"updated": True}}
