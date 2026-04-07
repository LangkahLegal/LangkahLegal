from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user
from schemas.users import ProfileUpdatePayload

router = APIRouter()

@router.get("/me/settings")
def get_settings_info(current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    # Return nama, email, avatar (foto_profil dari tabel users)
    user = db.table("users").select("nama, email, foto_profil").eq("id_user", current_user["id_user"]).single().execute()
    return {
        "nama": user.data["nama"],
        "email": user.data["email"],
        "avatar": user.data.get("foto_profil")
    }

@router.get("/me/profile/full")
def get_full_profile(current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    # Ambil data dasar
    user = db.table("users").select("nama, email, foto_profil, role").eq("id_user", current_user["id_user"]).single().execute().data
    
    if user["role"] == "konsultan":
        # Ambil data profesional
        kons = db.table("konsultan").select("*").eq("id_user", current_user["id_user"]).single().execute().data
        return {
            **user,
            "avatar": user["foto_profil"],
            "portofolio": kons["portofolio"], # <--- Langsung return portofolio
            **kons
        }
    return user

@router.put("/me/profile/update")
def update_profile(payload: ProfileUpdatePayload, current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    # 1. Update tabel users
    if payload.nama or payload.avatar:
        u_data = {}
        if payload.nama: u_data["nama"] = payload.nama
        if payload.avatar: u_data["foto_profil"] = payload.avatar
        db.table("users").update(u_data).eq("id_user", current_user["id_user"]).execute()

    # 2. Update tabel konsultan
    if current_user["role"] == "konsultan":
        # Gunakan exclude_none agar data yang tidak dikirim tidak tertimpa
        k_data = payload.dict(exclude_none=True)
        
        # Buang field yang milik tabel users
        for key in ["nama", "avatar"]:
            k_data.pop(key, None)
            
        if k_data:
            # Karena payload.portofolio sudah sama dengan nama kolom di DB, 
            # kita tidak perlu mapping lagi.
            db.table("konsultan").update(k_data).eq("id_user", current_user["id_user"]).execute()
            
    return {"message": "Profil berhasil diperbarui"}