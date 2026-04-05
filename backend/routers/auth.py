from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from supabase import Client

from schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, TokenResponse
from schemas.auth import ConsultantRegisterRequest
from database import get_supabase_client

# TODO: Kamu perlu menginstal 'passlib' dan 'pyjwt' untuk hashing dan token
# pip install passlib[bcrypt] pyjwt
from passlib.context import CryptContext
import jwt
import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Secret key untuk JWT (Nanti pindahkan ke file .env / config.py ya)
SECRET_KEY = "supersecretkey_langkahlegal"
ALGORITHM = "HS256"

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(request: RegisterRequest, db: Client = Depends(get_supabase_client)):
    """
    Endpoint untuk registrasi akun baru (Client / Konsultan).
    """
    # 1. Cek apakah email sudah terdaftar
    existing_user = db.table("users").select("*").eq("email", request.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    # 2. Hash password sebelum disimpan
    hashed_password = pwd_context.hash(request.password)

    # 3. Insert ke tabel users
    user_data = {
        "nama": request.nama,
        "email": request.email,
        "password": hashed_password,
        "role": request.role.value
    }
    new_user = db.table("users").insert(user_data).execute()
    
    if not new_user.data:
        raise HTTPException(status_code=500, detail="Gagal mendaftarkan user")
        
    inserted_id = new_user.data[0]["id_user"]

    # 4. Jika role 'konsultan', buat baris default di tabel konsultan
    # Mengisi default value karena ada constraint NOT NULL di skema database
    if request.role.value == "konsultan":
        default_konsultan_data = {
            "id_user": inserted_id,
            "nama_lengkap": request.nama,
            "kota_praktik": "Belum diatur",
            "pengalaman_tahun": 0,
            "tarif_per_sesi": 0.00,
            "spesialisasi": "Umum"
        }
        db.table("konsultan").insert(default_konsultan_data).execute()

    return {
        "message": "Registrasi berhasil",
        "data": {
            "id_user": inserted_id,
            "role": request.role.value
        }
    }

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_user(request: LoginRequest, db: Client = Depends(get_supabase_client)):
    """
    Endpoint untuk login dan mendapatkan JWT Token.
    """
    # 1. Cari user berdasarkan email
    user_response = db.table("users").select("*").eq("email", request.email).execute()
    if not user_response.data:
        raise HTTPException(status_code=401, detail="Email atau password salah")
        
    user = user_response.data[0]

    # 2. Verifikasi hash password
    if not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    # 3. Generate JWT Token
    payload = {
        "id_user": user["id_user"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Token expired dalam 24 jam
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
    
@router.post("/consultant/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_consultant(request: ConsultantRegisterRequest, db: Client = Depends(get_supabase_client)):
    """
    Endpoint khusus untuk registrasi akun Konsultan Hukum.
    """
    # 1. Cek apakah email sudah terdaftar
    existing_user = db.table("users").select("*").eq("email", request.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    # 2. Hash password
    hashed_password = pwd_context.hash(request.password)

    # 3. Insert ke tabel users (Otomatis role di-set 'konsultan')
    user_data = {
        "nama": request.nama,
        "email": request.email,
        "password": hashed_password,
        "role": "konsultan"
    }
    new_user = db.table("users").insert(user_data).execute()
    
    if not new_user.data:
        raise HTTPException(status_code=500, detail="Gagal mendaftarkan user")
        
    inserted_id = new_user.data[0]["id_user"]

    # 4. Insert ke tabel konsultan dengan data spesifik dari request
    konsultan_data = {
        "id_user": inserted_id,
        "nama_lengkap": request.nama, # Bisa disesuaikan dengan gelar nanti
        "kota_praktik": request.kota_praktik,
        "spesialisasi": request.spesialisasi,
        "pengalaman_tahun": request.pengalaman_tahun,
        "tarif_per_sesi": request.tarif_per_sesi,
        "status_verifikasi": "pending" # Default dari database
    }
    
    db.table("konsultan").insert(konsultan_data).execute()

    return {
        "message": "Registrasi konsultan berhasil. Menunggu verifikasi admin.",
        "data": {
            "id_user": inserted_id,
            "role": "konsultan"
        }
    }