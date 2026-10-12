from fastapi import UploadFile
from supabase import Client

from config import get_settings
from exceptions import ForbiddenError
from schemas.users import ProfileUpdatePayload
from services.storage_service import upload_portfolio_pdf_to_supabase


def get_settings_info(db: Client, current_user: dict) -> dict:
    user = db.table("users").select("nama, email, foto_profil").eq("id_user", current_user["id_user"]).single().execute()
    return {
        "nama": user.data["nama"],
        "email": user.data["email"],
        "foto_profil": user.data.get("foto_profil")
    }


def get_full_profile(db: Client, current_user: dict) -> dict:
    user = db.table("users").select("nama, email, foto_profil, role").eq("id_user", current_user["id_user"]).single().execute().data

    if user["role"] == "konsultan":
        kons = db.table("konsultan").select("*").eq("id_user", current_user["id_user"]).single().execute().data
        return {
            **user,
            "foto_profil": user["foto_profil"],
            "portofolio": kons["portofolio"],
            **kons
        }
    return user


async def update_profile(
    db: Client,
    current_user: dict,
    payload: ProfileUpdatePayload,
    explicit_portofolio_field: bool,
    portofolio_file: UploadFile | None,
) -> dict:
    """
    `explicit_portofolio_field` bernilai True jika client benar-benar mengirim
    field `portofolio` (termasuk string kosong untuk menghapus portofolio).
    """
    normalized_portofolio_value: str | None = None
    if explicit_portofolio_field:
        normalized_portofolio_value = (payload.portofolio or "").strip() or None

    u_data = {}
    if payload.nama:
        u_data["nama"] = payload.nama

    if payload.foto_profil:
        u_data["foto_profil"] = payload.foto_profil

    if u_data:
        db.table("users").update(u_data).eq("id_user", current_user["id_user"]).execute()

    if current_user["role"] != "konsultan" and (payload.portofolio is not None or portofolio_file is not None):
        raise ForbiddenError("Hanya konsultan yang dapat mengubah portofolio")

    if current_user["role"] == "konsultan":
        k_data = {
            "bio_singkat": payload.bio_singkat,
            "deskripsi_lengkap": payload.deskripsi_lengkap,
            "nomor_izin_praktik": payload.nomor_izin_praktik,
            "gelar_akademik": payload.gelar_akademik,
            "pendidikan_terakhir": payload.pendidikan_terakhir,
            "kota_praktik": payload.kota_praktik,
            "spesialisasi": payload.spesialisasi,
            "pengalaman_tahun": payload.pengalaman_tahun,
            "tarif_per_sesi": payload.tarif_per_sesi,
            "linkedin": payload.linkedin,
        }

        if explicit_portofolio_field:
            k_data["portofolio"] = normalized_portofolio_value

        if payload.nama:
            k_data["nama_lengkap"] = payload.nama

        if portofolio_file is not None:
            settings = get_settings()
            portofolio_url = await upload_portfolio_pdf_to_supabase(
                file=portofolio_file,
                user_id=current_user["id_user"],
                db_client=db,
                bucket_name=settings.supabase_portofolio_bucket,
            )
            k_data["portofolio"] = portofolio_url
            normalized_portofolio_value = portofolio_url

        k_data = {
            k: v
            for k, v in k_data.items()
            if v is not None or (k == "portofolio" and explicit_portofolio_field)
        }

        if k_data:
            db.table("konsultan").update(k_data).eq("id_user", current_user["id_user"]).execute()

    return {
        "message": "Profil dan kredensial berhasil diperbarui",
        "portofolio": normalized_portofolio_value,
    }
