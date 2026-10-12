import logging
from typing import Optional

from fastapi import UploadFile
from supabase import Client

from core.config import get_settings
from core.constants import Role, StatusBursa, StatusPengajuan
from core.exceptions import BadRequestError, InternalError, NotFoundError
from helpers.access import require_konsultan_id, require_role
from repositories import (
    case_repository,
    consultant_repository,
    consultation_repository,
    user_repository,
)
from services.email_service import get_frontend_base_url, send_notification_email
from services.storage_service import upload_supporting_document_to_supabase

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = [
    StatusPengajuan.PENDING,
    StatusPengajuan.MENUNGGU_PEMBAYARAN,
    StatusPengajuan.TERJADWAL,
]


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
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat memposting kasus")

    if dokumen_pendukung_files:
        valid_files = [f for f in dokumen_pendukung_files if f.filename]
        if len(valid_files) > 10:
            raise BadRequestError("Maksimal 10 file dokumen pendukung")
    else:
        valid_files = []

    created = case_repository.insert(db, {
        "id_user": current_user["id_user"],
        "kategori_hukum": kategori_hukum.lower().strip(),
        "deskripsi_kasus_awam": deskripsi_kasus_awam,
        "dokumen_bukti": dokumen_bukti,
        "tanggal_konsultasi": tanggal_konsultasi,
        "jam_mulai": jam_mulai,
        "jam_selesai": jam_selesai,
        "status_bursa": StatusBursa.OPEN,
    })
    if not created:
        raise InternalError("Gagal memposting kasus")

    id_bursa = created[0]["id_bursa"]

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
        case_repository.update(db, id_bursa, {"dokumen_bukti": combined})

    return {
        "message": "Kasus berhasil diposting secara anonim ke bursa",
        "data": created[0],
        "dokumen_terupload": uploaded_docs,
        "dokumen_gagal": failed_docs,
    }


def list_open_cases(db: Client, current_user: dict) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa melihat bursa")

    return {
        "message": "Berhasil mengambil data bursa kasus",
        "data": case_repository.list_by_status(db, StatusBursa.OPEN),
    }


def _ensure_no_schedule_conflict(db: Client, id_konsultan: int, kasus_data: dict) -> None:
    kasus_date = (kasus_data.get("tanggal_konsultasi") or "").split("T")[0]
    kasus_start = kasus_data.get("jam_mulai", "00:00")[:5]
    kasus_end = kasus_data.get("jam_selesai", "00:00")[:5]

    if not (kasus_date and kasus_start and kasus_end):
        return

    active_consultations = consultation_repository.list_by_konsultan_and_statuses(
        db,
        id_konsultan,
        ACTIVE_STATUSES,
        "jam_mulai, jam_selesai, jadwal_ketersediaan(tanggal, jam_mulai, jam_selesai), tanggal_pengajuan",
    )

    for active in active_consultations:
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
        client = user_repository.get_by_id_strict(db, kasus_data["id_user"], "email, nama")
        if client:
            client_email = client["email"]
            client_nama = client["nama"]
            frontend_base_url = get_frontend_base_url()

            konsultan = consultant_repository.get_by_id_strict(db, id_konsultan, "nama_lengkap")
            kons_nama = konsultan["nama_lengkap"] if konsultan else "Seorang konsultan"

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
        logger.error(f"Gagal kirim email bursa diklaim: {e}")


def claim_case(db: Client, current_user: dict, id_bursa: int) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengklaim kasus")

    real_id_konsultan = require_konsultan_id(
        db,
        current_user["id_user"],
        "Profil konsultan tidak ditemukan. Pastikan Anda sudah terdaftar sebagai konsultan.",
    )

    kasus_data = case_repository.get_by_id(
        db,
        id_bursa,
        "id_bursa, id_user, status_bursa, deskripsi_kasus_awam, tanggal_konsultasi, jam_mulai, jam_selesai, dokumen_bukti",
    )

    if kasus_data is None:
        raise NotFoundError("Kasus bursa tidak ditemukan")

    if kasus_data["status_bursa"] != StatusBursa.OPEN:
        raise BadRequestError("Kasus ini sudah diklaim oleh konsultan lain")

    _ensure_no_schedule_conflict(db, real_id_konsultan, kasus_data)

    case_repository.update(db, id_bursa, {"status_bursa": StatusBursa.CLOSED})

    created = consultation_repository.insert(db, {
        "id_user": kasus_data["id_user"],
        "id_konsultan": real_id_konsultan,
        "id_bursa": id_bursa,
        "status_pengajuan": StatusPengajuan.TERJADWAL,
        "deskripsi_kasus": kasus_data.get("deskripsi_kasus_awam", "Hasil dari Bursa Kasus"),
        "tanggal_pengajuan": kasus_data.get("tanggal_konsultasi"),
        "jam_mulai": kasus_data.get("jam_mulai"),
        "jam_selesai": kasus_data.get("jam_selesai"),
    })

    if not created:
        case_repository.update(db, id_bursa, {"status_bursa": StatusBursa.OPEN})
        raise InternalError("Gagal membuat draf konsultasi. Silakan coba lagi.")

    _notify_client_case_claimed(db, kasus_data, real_id_konsultan, id_bursa, created[0])

    return {
        "message": "Kasus berhasil diklaim. Draf konsultasi telah dibuat.",
        "data": created[0],
    }
