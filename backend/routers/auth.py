from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from supabase import Client

from schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, TokenResponse
from schemas.auth import ConsultantRegisterRequest, ProfilePhotoResponse, UserProfileResponse, RoleEnum
from database import get_supabase_client
from config import get_settings
from dependencies import get_current_user
from services import upload_to_imgbb, update_user_profile_photo

# TODO: Kamu perlu menginstal 'passlib' dan 'pyjwt' untuk hashing dan token
# pip install passlib[bcrypt] pyjwt
from passlib.context import CryptContext
import jwt
import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = get_settings().JWT_SECRET_KEY
ALGORITHM = "HS256"
DEFAULT_PROFILE_PHOTO_URL = "https://i.ibb.co.com/2184x6g3/default-picture.jpg"

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    nama: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: RoleEnum = Form(...),
    file: UploadFile | None = File(None),
    db: Client = Depends(get_supabase_client)
):
    """
    Refactor: Register ke Supabase Auth + Simpan Profile Lokal.
    """
    # 1. Register ke Supabase Auth
    auth_res = db.auth.sign_up({"email": email, "password": password})
    if not auth_res.user:
        raise HTTPException(status_code=400, detail="Gagal mendaftar di Supabase")

    # 2. Upload foto (tetap pakai logic ImgBB kamu)
    foto_profil_url = DEFAULT_PROFILE_PHOTO_URL
    if file:
        foto_profil_url = await upload_to_imgbb(file, get_settings().imgbb_api_key)

    # 3. Simpan ke tabel users lokal menggunakan UUID Supabase
    user_data = {
        "auth_user_id": auth_res.user.id, # UUID dari Supabase
        "nama": nama,
        "email": email,
        "role": role.value,
        "foto_profil": foto_profil_url,
    }
    db.table("users").insert(user_data).execute()
    return {"message": "Registrasi berhasil"}

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login_user(request: LoginRequest, db: Client = Depends(get_supabase_client)):
    """
    Refactor: Login via Supabase Auth.
    """
    try:
        res = db.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "access_token": res.session.access_token,
            "token_type": "bearer"
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
@router.post("/consultant/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_consultant(
    nama: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    kota_praktik: str = Form(...),
    spesialisasi: str = Form(...),
    pengalaman_tahun: int = Form(...),
    tarif_per_sesi: float = Form(...),
    file: UploadFile | None = File(None),
    db: Client = Depends(get_supabase_client)
):
    """
    Endpoint khusus untuk registrasi akun Konsultan Hukum.
    """
    # 1. Cek apakah email sudah terdaftar
    existing_user = db.table("users").select("*").eq("email", email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    # 2. Hash password
    hashed_password = pwd_context.hash(password)

    foto_profil_url = DEFAULT_PROFILE_PHOTO_URL
    if file is not None:
        foto_profil_url = await upload_to_imgbb(file, get_settings().imgbb_api_key)

    # 3. Insert ke tabel users (Otomatis role di-set 'konsultan')
    user_data = {
        "nama": nama,
        "email": email,
        "password": hashed_password,
        "role": "konsultan",
        "foto_profil": foto_profil_url,
    }
    new_user = db.table("users").insert(user_data).execute()
    
    if not new_user.data:
        raise HTTPException(status_code=500, detail="Gagal mendaftarkan user")
        
    inserted_id = new_user.data[0]["id_user"]

    # 4. Insert ke tabel konsultan dengan data spesifik dari request
    konsultan_data = {
        "id_user": inserted_id,
        "nama_lengkap": nama, # Bisa disesuaikan dengan gelar nanti
        "kota_praktik": kota_praktik,
        "spesialisasi": spesialisasi,
        "pengalaman_tahun": pengalaman_tahun,
        "tarif_per_sesi": tarif_per_sesi,
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

@router.post("/upload-profile-photo", response_model=ProfilePhotoResponse, status_code=status.HTTP_200_OK)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    Endpoint untuk upload foto profil. 
    - File diunggah ke ImgBB
    - URL disimpan ke database users.foto_profil
    - Hanya user yang login bisa upload foto mereka sendiri
    
    Args:
        file: File gambar (format: jpg, png, gif, webp, max size: 5MB)
        current_user: User yang sudah di-authorize via JWT token
        db: Database client (Supabase)
        
    Returns:
        ProfilePhotoResponse dengan URL foto
    """
    user_id = current_user["id_user"]
    
    result = await update_user_profile_photo(user_id, file, db)
    
    user_data = db.table("users").select("*").eq("id_user", user_id).execute()
    if not user_data.data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    user = user_data.data[0]
    
    return {
        "message": result["message"],
        "foto_profil_url": result["foto_profil_url"],
        "id_user": user["id_user"],
        "email": user["email"]
    }


@router.get("/profile", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def get_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    Endpoint untuk GET profile user (dengan foto profil).
    - Hanya user yang login bisa akses profile mereka
    - Return data user + foto_profil URL dari database
    
    Returns:
        UserProfileResponse dengan semua data user + foto
    """
    user_id = current_user["id_user"]
    
    # Query user dari database
    user_data = db.table("users").select("*").eq("id_user", user_id).execute()
    
    if not user_data.data:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    user = user_data.data[0]
    
    return {
        "id_user": user["id_user"],
        "nama": user["nama"],
        "email": user["email"],
        "role": user["role"],
        "foto_profil": user.get("foto_profil"), 
        "created_at": user["created_at"],
        "updated_at": user["updated_at"]
    }