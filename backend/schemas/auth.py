from pydantic import BaseModel
from typing import Optional

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
    refresh_token: str


class OAuthPayload(BaseModel):
    redirectTo: str
    provider: Optional[str] = "google"


class RolePayload(BaseModel):
    role: str