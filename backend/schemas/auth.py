from typing import Optional

from pydantic import BaseModel


class SignUpPayload(BaseModel):
    email: str
    password: str
    name: str
    role: str
    emailRedirectTo: Optional[str] = None


class OtpLoginPayload(BaseModel):
    email: str
    emailRedirectTo: Optional[str] = None


class ResendOtpPayload(BaseModel):
    email: str
    emailRedirectTo: Optional[str] = None


class VerifyOtpPayload(BaseModel):
    email: str
    token: str
    type: Optional[str] = "email"


class PasswordLoginPayload(BaseModel):
    email: str
    password: str


class RefreshTokenPayload(BaseModel):
    refresh_token: Optional[str] = None


class ExchangeCodePayload(BaseModel):
    code: Optional[str] = None
    code_verifier: Optional[str] = None


class OAuthPayload(BaseModel):
    redirectTo: str
    provider: Optional[str] = "google"


class RolePayload(BaseModel):
    role: str


class ForgotPasswordPayload(BaseModel):
    email: str
    emailRedirectTo: Optional[str] = None


class ResetPasswordPayload(BaseModel):
    new_password: str
    current_password: Optional[str] = None
