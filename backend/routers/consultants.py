from fastapi import APIRouter, Depends, HTTPException, status 
from supabase import Client
from database import get_supabase_client
from schemas.consultants import ConsultantUpdate 
from dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Schema internal untuk input jadwal oleh Konsultan
class ScheduleCreate(BaseModel):
    tanggal: str      # Format: YYYY-MM-DD
    jam_mulai: str    # Format: HH:MM
    jam_selesai: str  # Format: HH:MM

# ==========================================
# 1. MODUL KATALOG (PUBLIK / CLIENT)
# ==========================================

@router.get("/", status_code=status.HTTP_200_OK)
def get_all_consultants(
    spesialisasi: Optional[str] = None,
    db: Client = Depends(get_supabase_client)
):
    """
    Mengambil daftar katalog konsultan untuk Client.
    Menampilkan profil dan nama user hasil JOIN.
    """
    try:
        # Gunakan '!' dan nama FK jika ada ambiguitas di DB kamu
        query = db.table("konsultan").select("*, users!fk_konsultan_user(nama)")

        if spesialisasi:
            query = query.ilike("spesialisasi", f"%{spesialisasi}%")

        response = query.execute()

        # Jika data kosong, berikan pesan informatif
        if not response.data:
            return {
                "message": "Katalog kosong. Pastikan data sudah diinput dan RLS dimatikan.",
                "data": []
            }

        # Transformasi data agar JSON lebih 'flat' untuk Frontend Aziz/Zachra
        formatted_data = []
        for item in response.data:
            user_info = item.get("users")
            
            # Handle respons join (bisa dict atau list tergantung versi postgrest)
            if isinstance(user_info, list) and len(user_info) > 0:
                nama_akun = user_info[0].get("nama", "User")
            elif isinstance(user_info, dict):
                nama_akun = user_info.get("nama", "User")
            else:
                nama_akun = "User"

            item["nama_akun"] = nama_akun
            if "users" in item:
                del item["users"]
            
            formatted_data.append(item)

        return {
            "status": "success",
            "total": len(formatted_data),
            "data": formatted_data
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memuat katalog: {str(e)}"
        )

@router.get("/{id_konsultan}", status_code=status.HTTP_200_OK)
def get_consultant_detail(id_konsultan: int, db: Client = Depends(get_supabase_client)):
    """
    Mengambil profil detail satu konsultan berdasarkan ID.
    """
    # Pastikan .eq() membandingkan dengan kolom 'id_konsultan' (bukan 'id')
    response = db.table("konsultan")\
        .select("*, users(nama, email)")\
        .eq("id_konsultan", id_konsultan)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Konsultan tidak ditemukan")

    return {
        "message": "Detail profil ditemukan",
        "data": response.data[0]
    }
    
@router.get("/{id_konsultan}/schedules", status_code=status.HTTP_200_OK)
def get_consultant_schedules(
    id_konsultan: int, 
    db: Client = Depends(get_supabase_client)
):
    """
    Melihat jadwal ketersediaan konsultan untuk diajukan oleh Klien.
    Penting: Hanya jadwal dengan status_tersedia = True yang muncul.
    """
    try:
        response = db.table("jadwal_ketersediaan")\
            .select("*")\
            .eq("id_konsultan", id_konsultan)\
            .eq("status_tersedia", True)\
            .execute()
        
        return {
            "status": "success",
            "id_konsultan": id_konsultan,
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil jadwal: {str(e)}")
    
@router.post("/schedules", status_code=status.HTTP_201_CREATED)
def upload_jadwal_konsultan(
    request: ScheduleCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    (Khusus Konsultan) Menambahkan slot jadwal ketersediaan.
    """
    # 1. Validasi Role
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa mengatur jadwal")

    # 2. Cari ID Konsultan asli (karena di token biasanya cuma ada id_user)
    konsultan = db.table("konsultan").select("id_konsultan").eq("id_user", current_user["id_user"]).execute()
    
    if not konsultan.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    # 3. Insert ke Tabel Jadwal
    new_schedule = {
        "id_konsultan": konsultan.data[0]["id_konsultan"],
        "tanggal": request.tanggal,
        "jam_mulai": request.jam_mulai,
        "jam_selesai": request.jam_selesai,
        "status_tersedia": True 
    }

    response = db.table("jadwal_ketersediaan").insert(new_schedule).execute()
    
    return {
        "message": "Jadwal berhasil ditambahkan", 
        "data": response.data[0]
    }