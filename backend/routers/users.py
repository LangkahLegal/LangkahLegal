from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user
from schemas.users import ProfileUpdatePayload
from config import get_settings
from services import upload_portfolio_pdf_to_supabase

router = APIRouter()

@router.get(
    "/me/settings",
    summary="Ambil data settings dasar user login",
    description="Mengembalikan data ringkas untuk halaman settings: nama, email, dan foto_profil.",
)
def get_settings_info(current_user: dict = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    user = db.table("users").select("nama, email, foto_profil").eq("id_user", current_user["id_user"]).single().execute()
    return {
        "nama": user.data["nama"],
        "email": user.data["email"],
        "foto_profil": user.data.get("foto_profil")
    }

@router.get(
    "/me/profile/full",
    summary="Ambil profile lengkap user login",
    description="""
Mengembalikan profile lengkap berdasarkan role user.

- Jika role `client`: mengembalikan profile dasar dari tabel users.
- Jika role `konsultan`: mengembalikan gabungan data users + data profesional dari tabel konsultan,
  termasuk field `portofolio`.
""",
)
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

@router.put(
    "/me/profile/update",
    summary="Update profile user / profile profesional konsultan",
    description="""
Endpoint update profile dalam satu pintu.

Mendukung:
1. `application/json` untuk update field teks biasa.
2. `multipart/form-data` untuk update dengan upload file portofolio.

Khusus konsultan:
- Upload file portofolio via field `portofolio_file` (PDF only).
- Hapus portofolio dengan mengirim field `portofolio` sebagai string kosong.

Catatan frontend:
- Untuk upload file, jangan set header Content-Type manual.
- Frontend cukup kirim `FormData` lalu browser otomatis menambahkan boundary multipart.
""",
)
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
    uploaded_portofolio_url = None
    explicit_portofolio_field = False
    normalized_portofolio_value: str | None = None

    if request.headers.get("content-type", "").startswith("application/json"):
        body = await request.json()
        payload = ProfileUpdatePayload(**body)
        nama = payload.nama
        foto_profil = payload.foto_profil
        bio_singkat = payload.bio_singkat
        deskripsi_lengkap = payload.deskripsi_lengkap
        nomor_izin_praktik = payload.nomor_izin_praktik
        gelar_akademik = payload.gelar_akademik
        pendidikan_terakhir = payload.pendidikan_terakhir
        kota_praktik = payload.kota_praktik
        spesialisasi = payload.spesialisasi
        pengalaman_tahun = payload.pengalaman_tahun
        tarif_per_sesi = payload.tarif_per_sesi
        linkedin = payload.linkedin
        portofolio = payload.portofolio
        explicit_portofolio_field = "portofolio" in body
        if explicit_portofolio_field:
            normalized_portofolio_value = (portofolio or "").strip() or None
    else:
        form_data = await request.form()
        explicit_portofolio_field = "portofolio" in form_data
        if explicit_portofolio_field:
            normalized_portofolio_value = (portofolio or "").strip() or None

    u_data = {}
    if nama:
        u_data["nama"] = nama
    
    if foto_profil:
        u_data["foto_profil"] = foto_profil

    if u_data:
        db.table("users").update(u_data).eq("id_user", current_user["id_user"]).execute()

    if current_user["role"] != "konsultan" and (portofolio is not None or portofolio_file is not None):
        raise HTTPException(status_code=403, detail="Hanya konsultan yang dapat mengubah portofolio")

    if current_user["role"] == "konsultan":
        k_data = {
            "bio_singkat": bio_singkat,
            "deskripsi_lengkap": deskripsi_lengkap,
            "nomor_izin_praktik": nomor_izin_praktik,
            "gelar_akademik": gelar_akademik,
            "pendidikan_terakhir": pendidikan_terakhir,
            "kota_praktik": kota_praktik,
            "spesialisasi": spesialisasi,
            "pengalaman_tahun": pengalaman_tahun,
            "tarif_per_sesi": tarif_per_sesi,
            "linkedin": linkedin,
        }

        if explicit_portofolio_field:
            k_data["portofolio"] = normalized_portofolio_value

        if nama:
            k_data["nama_lengkap"] = nama

        if portofolio_file is not None:
            settings = get_settings()
            portofolio_url = await upload_portfolio_pdf_to_supabase(
                file=portofolio_file,
                user_id=current_user["id_user"],
                db_client=db,
                bucket_name=settings.supabase_portofolio_bucket,
            )
            uploaded_portofolio_url = portofolio_url
            k_data["portofolio"] = portofolio_url
            normalized_portofolio_value = portofolio_url

        # Tetap kirim portofolio=None jika user eksplisit mengosongkan field.
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