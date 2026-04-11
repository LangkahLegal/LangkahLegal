from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user
from schemas.users import ProfileUpdatePayload

router = APIRouter()

@router.get("/me/settings")
def get_settings_info(current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    user = db.table("users").select("nama, email, foto_profil").eq("id_user", current_user["id_user"]).single().execute()
    return {
        "nama": user.data["nama"],
        "email": user.data["email"],
        "foto_profil": user.data.get("foto_profil")
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
            "foto_profil": user["foto_profil"],
            "portofolio": kons["portofolio"], 
            **kons
        }
    return user
@router.put("/me/profile/update")
def update_profile(
    payload: ProfileUpdatePayload, 
    current_user: dict = Depends(get_current_user), 
    db: Client = Depends(get_supabase_client)
):
    # 1. Update tabel 'users' (Source of Truth untuk Nama dan Foto)
    u_data = {}
    if payload.nama: 
        u_data["nama"] = payload.nama
    
    # Pastikan menggunakan ejaan 'foto_profil' sesuai database.sql
    if payload.foto_profil: 
        u_data["foto_profil"] = payload.foto_profil

    if u_data:
        db.table("users").update(u_data).eq("id_user", current_user["id_user"]).execute()

    # 2. Update tabel 'konsultan'
    if current_user["role"] == "konsultan":
        k_data = payload.dict(exclude_none=True)
        
        if "nama" in k_data:
            k_data["nama_lengkap"] = k_data["nama"]

        keys_for_users_only = ["nama", "email"] 
        
        for key in keys_for_users_only:
            k_data.pop(key, None)
            
        if k_data:
            db.table("konsultan").update(k_data).eq("id_user", current_user["id_user"]).execute()
            
    return {"message": "Profil dan kredensial berhasil diperbarui"}