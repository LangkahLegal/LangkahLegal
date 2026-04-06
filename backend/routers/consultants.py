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
    Mengambil daftar katalog konsultan yang AKTIF.
    Format output disesuaikan dengan props ConsultantCard di Next.js:
    (name, spec, rating, reviews, status)
    """
    try:
        # Join ke pengajuan_konsultasi -> rating_ulasan untuk hitung rating
        # Sesuai database.sql: rating ada di tabel 'rating_ulasan' kolom 'skor_rating'
        query = db.table("konsultan").select("""
            id_konsultan,
            nama_lengkap,
            spesialisasi,
            is_active,
            rating_ulasan (skor_rating)
        """).eq("is_active", True) # Instruksi PM: Hanya return yang aktif

        if spesialisasi:
            query = query.ilike("spesialisasi", f"%{spesialisasi}%")

        response = query.execute()

        formatted_data = []
        for item in response.data:
            # Ambil semua skor_rating dari hasil join
            ratings = [
                r['skor_rating'] for r in item.get('rating_ulasan', []) 
                if r.get('skor_rating') is not None
            ]
            #rating_avg
            total_reviews = len(ratings)
            rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

            # MAPPING KE FRONTEND (id, name, spec, rating, reviews, status)
            formatted_item = {
                "id": item["id_konsultan"],
                "name": item["nama_lengkap"],
                "spec": item["spesialisasi"],
                "rating": rating_avg,
                "reviews": total_reviews,
                "status": "online", # Default online jika is_active true
                "avatar": None      # Diabaikan sesuai instruksi
            }
            formatted_data.append(formatted_item)

        return formatted_data # Return list murni agar Next.js bisa .map()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memuat katalog: {str(e)}")

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

# ==========================================
# 2. MODUL PENGATURAN STATUS (NEW)
# ==========================================

#is_active
@router.patch("/me/status", status_code=status.HTTP_200_OK)
def toggle_consultant_active_status(
    is_active: bool,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    (Khusus Konsultan) Mengubah status apakah ingin menerima konsultasi (is_active).
    """
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa mengubah status aktif")

    response = db.table("konsultan")\
        .update({"is_active": is_active})\
        .eq("id_user", current_user["id_user"])\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    return {
        "message": f"Status aktif berhasil diubah menjadi {is_active}",
        "data": {"is_active": is_active}
    }