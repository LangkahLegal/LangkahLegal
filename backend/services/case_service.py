from typing import Optional

from fastapi import UploadFile
from supabase import Client

from config import get_settings
from exceptions import BadRequestError, ForbiddenError, InternalError, NotFoundError
from services.email_service import get_frontend_base_url, send_notification_email
from services.storage_service import upload_supporting_document_to_supabase


async def post_case(
    db: Client,
    current_user: dict,
    kategori_hukum: str,
    deskripsi_kasus_awam: str,
    tanggal_konsultasi: str,
    jam_mulai: str,
    jam_selesai: str,
    dokumen_bukti: Optional[str],
    dokumen_pendukung_files: list[UploadFile] | None,
) -> dict:
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang dapat memposting kasus")

    if dokumen_pendukung_files:
        valid_files = [f for f in dokumen_pendukung_files if f.filename]
        if len(valid_files) > 10:
            raise BadRequestError("Maksimal 10 file dokumen pendukung")
    else:
        valid_files = []

    data_kasus = {
        "id_user": current_user["id_user"],
        "kategori_hukum": kategori_hukum.lower().strip(),
        "deskripsi_kasus_awam": deskripsi_kasus_awam,
        "dokumen_bukti": dokumen_bukti,
        "tanggal_konsultasi": tanggal_konsultasi,
        "jam_mulai": jam_mulai,
        "jam_selesai": jam_selesai,
        "status_bursa": "open",
    }

    response = db.table("bursa_kasus").insert(data_kasus).execute()
    if not response.data:
        raise InternalError("Gagal memposting kasus")

    id_bursa = response.data[0]["id_bursa"]

    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket
    uploaded_docs = []
    failed_docs = []
    file_urls = []

    for file in valid_files:
        try:
            doc_meta = await upload_supporting_document_to_supabase(
                file=file,
                id_pengajuan=id_bursa,
                id_user=current_user["id_user"],
                db_client=db,
                bucket_name=bucket_name,
            )
            uploaded_docs.append(doc_meta["nama_dokumen"])
            file_urls.append(doc_meta["file_url"])
        except Exception as e:
            failed_docs.append({"nama": file.filename, "alasan": str(e)})

    if file_urls:
        combined = dokumen_bukti or ""
        if combined:
            combined += ","
        combined += ",".join(file_urls)
        db.table("bursa_kasus").update({"dokumen_bukti": combined}).eq("id_bursa", id_bursa).execute()

    return {
        "message": "Kasus berhasil diposting secara anonim ke bursa",
        "data": response.data[0],
        "dokumen_terupload": uploaded_docs,
        "dokumen_gagal": failed_docs,
    }


def list_open_cases(db: Client, current_user: dict) -> dict:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya konsultan yang bisa melihat bursa")

    response = db.table("bursa_kasus").select("*").eq("status_bursa", "open").execute()
    return {"message": "Berhasil mengambil data bursa kasus", "data": response.data}


def _ensure_no_schedule_conflict(db: Client, id_konsultan: int, kasus_data: dict) -> None:
    kasus_date = (kasus_data.get("tanggal_konsultasi") or "").split("T")[0]
    kasus_start = kasus_data.get("jam_mulai", "00:00")[:5]
    kasus_end = kasus_data.get("jam_selesai", "00:00")[:5]

    if not (kasus_date and kasus_start and kasus_end):
        return

    active_consultations = (
        db.table("pengajuan_konsultasi")
        .select("jam_mulai, jam_selesai, jadwal_ketersediaan(tanggal, jam_mulai, jam_selesai), tanggal_pengajuan")
        .eq("id_konsultan", id_konsultan)
        .in_("status_pengajuan", ["pending", "menunggu_pembayaran", "terjadwal"])
        .execute()
    )

    for active in active_consultations.data:
        active_jadwal = active.get("jadwal_ketersediaan") or {}

        a_date_raw = active_jadwal.get("tanggal") or active.get("tanggal_pengajuan")
        a_date = (a_date_raw or "").split("T")[0]

        if not a_date or a_date != kasus_date:
            continue

        a_start = (active.get("jam_mulai") or active_jadwal.get("jam_mulai") or "00:00")[:5]
        a_end = (active.get("jam_selesai") or active_jadwal.get("jam_selesai") or "00:00")[:5]

        if kasus_start < a_end and kasus_end > a_start:
            raise BadRequestError(
                f"Gagal klaim: Anda sudah memiliki jadwal konsultasi aktif yang bertabrakan pada {kasus_date} jam {a_start}-{a_end}."
            )


def _notify_client_case_claimed(
    db: Client, kasus_data: dict, id_konsultan: int, id_bursa: int, pengajuan: dict
) -> None:
    try:
        id_pengajuan = pengajuan["id_pengajuan"]
        client_res = db.table("users").select("email, nama").eq("id_user", kasus_data["id_user"]).single().execute()
        if client_res.data:
            client_email = client_res.data["email"]
            client_nama = client_res.data["nama"]
            frontend_base_url = get_frontend_base_url()

            kons_res = db.table("konsultan").select("nama_lengkap").eq("id_konsultan", id_konsultan).single().execute()
            kons_nama = kons_res.data["nama_lengkap"] if kons_res.data else "Seorang konsultan"

            subject = "Kabar Baik! Kasus Anda di Bursa Telah Diambil"
            message = f"""Halo {client_nama},

Kasus hukum yang Anda posting di bursa (ID Bursa: {id_bursa}) telah diambil oleh {kons_nama}.

Sebuah pengajuan konsultasi telah dibuat secara otomatis untuk Anda (ID Pengajuan: {id_pengajuan}).
Konsultan akan segera mengatur jadwal untuk sesi Anda. Silakan pantau halaman Dashboard atau halaman Konsultasi di aplikasi LangkahLegal.

Tautan untuk memantau status pengajuan:
{frontend_base_url}/consultation/{id_pengajuan}

Terima kasih.
"""
            send_notification_email(client_email, subject, message)
    except Exception as e:
        print(f"[EMAIL ERROR] Gagal kirim email bursa diklaim: {e}")


def claim_case(db: Client, current_user: dict, id_bursa: int) -> dict:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya konsultan yang bisa mengklaim kasus")

    konsultan_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .execute()
    )

    if not konsultan_profile.data:
        raise NotFoundError(
            "Profil konsultan tidak ditemukan. Pastikan Anda sudah terdaftar sebagai konsultan."
        )

    real_id_konsultan = konsultan_profile.data[0]["id_konsultan"]

    kasus = (
        db.table("bursa_kasus")
        .select("id_bursa, id_user, status_bursa, deskripsi_kasus_awam, tanggal_konsultasi, jam_mulai, jam_selesai, dokumen_bukti")
        .eq("id_bursa", id_bursa)
        .execute()
    )

    if not kasus.data:
        raise NotFoundError("Kasus bursa tidak ditemukan")

    kasus_data = kasus.data[0]

    if kasus_data["status_bursa"] != "open":
        raise BadRequestError("Kasus ini sudah diklaim oleh konsultan lain")

    _ensure_no_schedule_conflict(db, real_id_konsultan, kasus_data)

    db.table("bursa_kasus").update({"status_bursa": "closed"}).eq(
        "id_bursa", id_bursa
    ).execute()

    new_consultation = {
        "id_user": kasus_data["id_user"],
        "id_konsultan": real_id_konsultan,
        "id_bursa": id_bursa,
        "status_pengajuan": "terjadwal",
        "deskripsi_kasus": kasus_data.get("deskripsi_kasus_awam", "Hasil dari Bursa Kasus"),
        "tanggal_pengajuan": kasus_data.get("tanggal_konsultasi"),
        "jam_mulai": kasus_data.get("jam_mulai"),
        "jam_selesai": kasus_data.get("jam_selesai"),
    }

    insert_response = (
        db.table("pengajuan_konsultasi").insert(new_consultation).execute()
    )

    if not insert_response.data:
        db.table("bursa_kasus").update({"status_bursa": "open"}).eq(
            "id_bursa", id_bursa
        ).execute()
        raise InternalError("Gagal membuat draf konsultasi. Silakan coba lagi.")

    _notify_client_case_claimed(
        db,
        kasus_data,
        real_id_konsultan,
        id_bursa,
        insert_response.data[0],
    )

    return {
        "message": "Kasus berhasil diklaim. Draf konsultasi telah dibuat.",
        "data": insert_response.data[0],
    }
