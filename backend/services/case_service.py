import logging

from supabase import Client

from core.constants import Role, StatusBursa, StatusPengajuan
from core.exceptions import BadRequestError, InternalError, NotFoundError
from core.user import CurrentUser
from helpers.access import require_konsultan_id, require_role
from repositories import case_repository, consultation_repository
from schemas.cases import CaseForm
from services import notification_service
from services.storage_service import select_valid_files, upload_supporting_documents

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = [
    StatusPengajuan.PENDING,
    StatusPengajuan.MENUNGGU_PEMBAYARAN,
    StatusPengajuan.TERJADWAL,
]


async def post_case(db: Client, current_user: CurrentUser, form: CaseForm) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat memposting kasus")

    valid_files = select_valid_files(form.dokumen_pendukung_files, "Maksimal 10 file dokumen pendukung")

    created = case_repository.insert(
        db,
        {
            "id_user": current_user.id_user,
            "kategori_hukum": form.kategori_hukum.lower().strip(),
            "deskripsi_kasus_awam": form.deskripsi_kasus_awam,
            "dokumen_bukti": form.dokumen_bukti,
            "tanggal_konsultasi": form.tanggal_konsultasi,
            "jam_mulai": form.jam_mulai,
            "jam_selesai": form.jam_selesai,
            "status_bursa": StatusBursa.OPEN,
        },
    )
    if not created:
        raise InternalError("Gagal memposting kasus")

    id_bursa = created[0]["id_bursa"]

    uploaded, failed_docs = await upload_supporting_documents(
        db, valid_files, id_bursa, current_user.id_user, lambda doc_meta: doc_meta
    )

    if uploaded:
        file_urls = [doc["file_url"] for doc in uploaded]
        combined = ",".join(([form.dokumen_bukti] if form.dokumen_bukti else []) + file_urls)
        case_repository.update(db, id_bursa, {"dokumen_bukti": combined})

    return {
        "message": "Kasus berhasil diposting secara anonim ke bursa",
        "data": created[0],
        "dokumen_terupload": [doc["nama_dokumen"] for doc in uploaded],
        "dokumen_gagal": failed_docs,
    }


def list_open_cases(db: Client, current_user: CurrentUser) -> dict:
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

    active_consultations = consultation_repository.list_time_slots(db, id_konsultan, ACTIVE_STATUSES)

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


def claim_case(db: Client, current_user: CurrentUser, id_bursa: int) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengklaim kasus")

    real_id_konsultan = require_konsultan_id(
        db,
        current_user,
        "Profil konsultan tidak ditemukan. Pastikan Anda sudah terdaftar sebagai konsultan.",
    )

    kasus_data = case_repository.get_by_id(db, id_bursa)

    if kasus_data is None:
        raise NotFoundError("Kasus bursa tidak ditemukan")

    if kasus_data["status_bursa"] != StatusBursa.OPEN:
        raise BadRequestError("Kasus ini sudah diklaim oleh konsultan lain")

    _ensure_no_schedule_conflict(db, real_id_konsultan, kasus_data)

    case_repository.update(db, id_bursa, {"status_bursa": StatusBursa.CLOSED})

    created = consultation_repository.insert(
        db,
        {
            "id_user": kasus_data["id_user"],
            "id_konsultan": real_id_konsultan,
            "id_bursa": id_bursa,
            "status_pengajuan": StatusPengajuan.TERJADWAL,
            "deskripsi_kasus": kasus_data.get("deskripsi_kasus_awam", "Hasil dari Bursa Kasus"),
            "tanggal_pengajuan": kasus_data.get("tanggal_konsultasi"),
            "jam_mulai": kasus_data.get("jam_mulai"),
            "jam_selesai": kasus_data.get("jam_selesai"),
        },
    )

    if not created:
        case_repository.update(db, id_bursa, {"status_bursa": StatusBursa.OPEN})
        raise InternalError("Gagal membuat draf konsultasi. Silakan coba lagi.")

    notification_service.client_case_claimed(db, kasus_data, real_id_konsultan, id_bursa, created[0])

    return {
        "message": "Kasus berhasil diklaim. Draf konsultasi telah dibuat.",
        "data": created[0],
    }
