from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from supabase import Client
from pydantic import ValidationError
from core.database import get_supabase_client
from core.dependencies import get_current_user
from schemas.users import ProfileUpdatePayload
from services import user_service
from docs import users as docs

router = APIRouter()

@router.get("/me/settings", **docs.GET_SETTINGS_INFO)
def get_settings_info(current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    return user_service.get_settings_info(db, current_user)

@router.get("/me/profile/full", **docs.GET_FULL_PROFILE)
def get_full_profile(current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    return user_service.get_full_profile(db, current_user)

@router.put("/me/profile/update", **docs.UPDATE_PROFILE)
async def update_profile(
    request: Request,
    nama: str | None = Form(default=None),
    foto_profil: str | None = Form(default=None),
    bio_singkat: str | None = Form(default=None),
    deskripsi_lengkap: str | None = Form(default=None),
    nomor_izin_praktik: str | None = Form(default=None),
    gelar_akademik: str | None = Form(default=None),
    pendidikan_terakhir: str | None = Form(default=None),
    kota_praktik: str | None = Form(default=None),
    spesialisasi: str | None = Form(default=None),
    pengalaman_tahun: int | None = Form(default=None),
    tarif_per_sesi: float | None = Form(default=None),
    linkedin: str | None = Form(default=None),
    portofolio: str | None = Form(default=None),
    portofolio_file: UploadFile | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    if request.headers.get("content-type", "").startswith("application/json"):
        body = await request.json()
        try:
            payload = ProfileUpdatePayload(**body)
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=e.errors())
        explicit_portofolio_field = "portofolio" in body
    else:
        form_data = await request.form()
        explicit_portofolio_field = "portofolio" in form_data
        payload = ProfileUpdatePayload.model_construct(
            nama=nama,
            foto_profil=foto_profil,
            bio_singkat=bio_singkat,
            deskripsi_lengkap=deskripsi_lengkap,
            nomor_izin_praktik=nomor_izin_praktik,
            gelar_akademik=gelar_akademik,
            pendidikan_terakhir=pendidikan_terakhir,
            kota_praktik=kota_praktik,
            spesialisasi=spesialisasi,
            pengalaman_tahun=pengalaman_tahun,
            tarif_per_sesi=tarif_per_sesi,
            linkedin=linkedin,
            portofolio=portofolio,
        )

    return await user_service.update_profile(
        db=db,
        current_user=current_user,
        payload=payload,
        explicit_portofolio_field=explicit_portofolio_field,
        portofolio_file=portofolio_file,
    )
