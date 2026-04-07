from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class RoleEnum(str, Enum):
    client = 'client'
    konsultan = 'konsultan'
    admin = 'admin'

class RegisterRequest(BaseModel):
    nama: str
    email: EmailStr
    password: str
    role: RoleEnum

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterResponseData(BaseModel):
    id_user: int
    role: str

class RegisterResponse(BaseModel):
    message: str
    data: RegisterResponseData

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    
class ConsultantRegisterRequest(BaseModel):
    nama: str
    email: EmailStr
    password: str
    # Field khusus untuk tabel konsultan
    kota_praktik: str
    spesialisasi: str
    pengalaman_tahun: int
    tarif_per_sesi: float

class ProfilePhotoResponse(BaseModel):
    message: str
    foto_profil_url: str
    id_user: int
    email: str

class UserProfileResponse(BaseModel):
    id_user: int
    nama: str
    email: str
    role: str
    foto_profil: Optional[str] = None
    created_at: str
    updated_at: str