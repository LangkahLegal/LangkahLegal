from typing import Literal, Optional

from pydantic import BaseModel, Field

from schemas.validation import MAX_NAME, MIN_PASSWORD_LENGTH

AppRole = Literal["client", "konsultan"]


class SignUpPayload(BaseModel):
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH, max_length=72)
    name: str = Field(..., min_length=1, max_length=MAX_NAME)
    role: AppRole
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
    role: AppRole


class ForgotPasswordPayload(BaseModel):
    email: str
    emailRedirectTo: Optional[str] = None


class ResetPasswordPayload(BaseModel):
    new_password: str = Field(..., min_length=MIN_PASSWORD_LENGTH, max_length=72)
    current_password: Optional[str] = None
