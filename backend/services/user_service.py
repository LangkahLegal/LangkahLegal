from fastapi import UploadFile
from supabase import Client

from core.config import get_settings
from core.constants import Role
from core.exceptions import ForbiddenError
from core.user import CurrentUser
from helpers.urls import ensure_https_url
from repositories import consultant_repository, user_repository
from schemas.users import ProfileUpdatePayload
from services.storage_service import (
    path_from_ref,
    sign_stored_ref,
    upload_avatar_to_supabase,
    upload_portfolio_pdf_to_supabase,
)


def get_settings_info(db: Client, current_user: CurrentUser) -> dict:
    user = user_repository.get_profile_fields(db, current_user.id_user)
    return {"nama": user["nama"], "email": user["email"], "foto_profil": user.get("foto_profil")}


def get_full_profile(db: Client, current_user: CurrentUser) -> dict:
    user = user_repository.get_profile_fields(db, current_user.id_user)

    if user["role"] == Role.KONSULTAN:
        kons = consultant_repository.get_by_user_strict(db, current_user.id_user)
        # user terakhir di-spread supaya foto_profil (dan field user lain) menang atas kolom konsultan yang bisa basi.
        portofolio = sign_stored_ref(db, get_settings().supabase_portofolio_bucket, kons["portofolio"])
        return {**kons, **user, "portofolio": portofolio}
    return user


def _stored_portofolio(value: str | None) -> str | None:
    value = (value or "").strip()
    if not value:
        return None
    bucket = get_settings().supabase_portofolio_bucket
    if path_from_ref(bucket, value) is not None:
        return path_from_ref(bucket, value)
    return ensure_https_url(value, "Tautan portofolio harus berupa tautan https")


def _profile_url(value: str | None, label: str) -> str | None:
    value = (value or "").strip()
    if not value:
        return value
    if "://" not in value:
        value = f"https://{value}"
    return ensure_https_url(value, f"{label} harus berupa tautan https")


PROFESSIONAL_FIELDS = (
    "bio_singkat",
    "deskripsi_lengkap",
    "nomor_izin_praktik",
    "gelar_akademik",
    "pendidikan_terakhir",
    "kota_praktik",
    "spesialisasi",
    "pengalaman_tahun",
    "tarif_per_sesi",
    "linkedin",
)


def _professional_fields(payload: ProfileUpdatePayload) -> dict:
    k_data = {field: getattr(payload, field) for field in PROFESSIONAL_FIELDS if getattr(payload, field) is not None}
    if payload.nama:
        k_data["nama_lengkap"] = payload.nama
    if "linkedin" in k_data:
        k_data["linkedin"] = _profile_url(k_data["linkedin"], "Tautan LinkedIn")
    return k_data


async def update_profile(
    db: Client,
    current_user: CurrentUser,
    payload: ProfileUpdatePayload,
    explicit_portofolio_field: bool,
    portofolio_file: UploadFile | None,
    foto_profil_file: UploadFile | None = None,
) -> dict:
    normalized_portofolio_value: str | None = None
    if explicit_portofolio_field:
        normalized_portofolio_value = _stored_portofolio(payload.portofolio)

    u_data = {}
    if payload.nama:
        u_data["nama"] = payload.nama

    foto_value: str | None = None
    if foto_profil_file is not None:
        foto_value = await upload_avatar_to_supabase(
            file=foto_profil_file,
            user_id=current_user.id_user,
            db_client=db,
            bucket_name=get_settings().supabase_avatar_bucket,
        )
    elif payload.foto_profil:
        foto_value = ensure_https_url(payload.foto_profil, "Foto profil harus berupa tautan https")

    if foto_value is not None:
        u_data["foto_profil"] = foto_value

    if u_data:
        user_repository.update(db, current_user.id_user, u_data)

    if current_user.role != Role.KONSULTAN and (payload.portofolio is not None or portofolio_file is not None):
        raise ForbiddenError("Hanya konsultan yang dapat mengubah portofolio")

    if current_user.role == Role.KONSULTAN:
        k_data = _professional_fields(payload)

        # Mirror foto ke tabel konsultan supaya surface yang baca konsultan.foto_profil ikut fresh.
        if foto_value is not None:
            k_data["foto_profil"] = foto_value

        if explicit_portofolio_field:
            k_data["portofolio"] = normalized_portofolio_value

        if portofolio_file is not None:
            normalized_portofolio_value = await upload_portfolio_pdf_to_supabase(
                file=portofolio_file,
                user_id=current_user.id_user,
                db_client=db,
                bucket_name=get_settings().supabase_portofolio_bucket,
            )
            k_data["portofolio"] = normalized_portofolio_value

        if k_data:
            consultant_repository.update_by_user(db, current_user.id_user, k_data)

    return {
        "message": "Profil dan kredensial berhasil diperbarui",
        "portofolio": normalized_portofolio_value,
    }
