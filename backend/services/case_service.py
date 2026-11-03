import logging

from supabase import Client

from core.constants import StatusBursa, StatusPengajuan
from core.exceptions import BadRequestError, ConflictError, InternalError, NotFoundError
from core.user import CurrentUser
from helpers.filters import date_range, time_range
from helpers.listing import clean_search, page_window, with_pagination
from helpers.schedule import ensure_not_past, find_conflict
from helpers.urls import ensure_https_url, is_https_url
from repositories import case_repository, consultation_repository
from schemas.cases import CaseForm, CaseListFilters, DokumenBursa, UrutanBursa
from services import notification_service
from services.storage_service import select_valid_files, upload_supporting_documents

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = [
    StatusPengajuan.PENDING,
    StatusPengajuan.MENUNGGU_PEMBAYARAN,
    StatusPengajuan.TERJADWAL,
]

DOKUMEN_ADA = {DokumenBursa.ADA: True, DokumenBursa.TIDAK: False}

URUTAN_KOLOM = {
    UrutanBursa.TERBARU: [("id_bursa", True)],
    UrutanBursa.TERLAMA: [("id_bursa", False)],
    UrutanBursa.JADWAL_TERDEKAT: [("tanggal_konsultasi", False), ("jam_mulai", False), ("id_bursa", True)],
}


async def post_case(db: Client, current_user: CurrentUser, form: CaseForm) -> dict:
    valid_files = select_valid_files(form.dokumen_pendukung_files, "Maksimal 10 file dokumen pendukung")
    dokumen_bukti = (
        ensure_https_url(form.dokumen_bukti, "Dokumen bukti harus berupa tautan https") if form.dokumen_bukti else None
    )
    ensure_not_past(form.tanggal_konsultasi, form.jam_mulai)
    _ensure_client_is_free(db, current_user.id_user, form)

    created = case_repository.insert(
        db,
        {
            "id_user": current_user.id_user,
            "kategori_hukum": form.kategori_hukum.lower().strip(),
            "deskripsi_kasus_awam": form.deskripsi_kasus_awam,
            "dokumen_bukti": dokumen_bukti,
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
        combined = ",".join(([dokumen_bukti] if dokumen_bukti else []) + file_urls)
        case_repository.update(db, id_bursa, {"dokumen_bukti": combined})

    return {
        "message": "Kasus berhasil diposting secara anonim ke bursa",
        "data": created[0],
        "dokumen_terupload": [doc["nama_dokumen"] for doc in uploaded],
        "dokumen_gagal": failed_docs,
    }


def _https_only(dokumen_bukti: str | None) -> str | None:
    urls = [url.strip() for url in (dokumen_bukti or "").split(",") if is_https_url(url.strip())]
    return ",".join(urls) or None


def list_open_cases(
    db: Client,
    current_user: CurrentUser,
    filters: CaseListFilters,
    page: int | None = None,
    page_size: int = 20,
) -> dict:
    kategori = (filters.kategori or "").strip().lower()
    tanggal_dari, tanggal_sebelum = date_range(filters.jadwal)
    jam_dari, jam_sebelum = time_range(filters.waktu)
    offset, limit = page_window(page, page_size)
    rows, total = case_repository.list_by_status(
        db,
        StatusBursa.OPEN,
        kategori=kategori if kategori and kategori != "semua" else None,
        search=clean_search(filters.search) or None,
        tanggal_dari=tanggal_dari,
        tanggal_sebelum=tanggal_sebelum,
        jam_dari=jam_dari,
        jam_sebelum=jam_sebelum,
        ada_dokumen=DOKUMEN_ADA.get(filters.dokumen),
        urutan=URUTAN_KOLOM[filters.urutkan],
        offset=offset,
        limit=limit,
    )

    for row in rows:
        row["dokumen_bukti"] = _https_only(row.get("dokumen_bukti"))

    payload = {"message": "Berhasil mengambil data bursa kasus", "data": rows}
    return with_pagination(payload, total if total is not None else len(rows), page, page_size)


def _ensure_no_schedule_conflict(db: Client, id_konsultan: int, kasus_data: dict) -> None:
    active_consultations = consultation_repository.list_time_slots(db, id_konsultan, ACTIVE_STATUSES)
    conflict = find_conflict(
        kasus_data.get("tanggal_konsultasi"),
        kasus_data.get("jam_mulai"),
        kasus_data.get("jam_selesai"),
        active_consultations,
    )
    if conflict:
        kasus_date = str(kasus_data.get("tanggal_konsultasi")).split("T")[0]
        raise BadRequestError(
            f"Gagal klaim: Anda sudah memiliki jadwal konsultasi aktif yang bertabrakan pada {kasus_date} jam {conflict[0]}-{conflict[1]}."
        )


def _ensure_client_is_free(db: Client, id_user: int, form: CaseForm) -> None:
    own_consultations = consultation_repository.list_time_slots_for_user(db, id_user, ACTIVE_STATUSES)
    conflict = find_conflict(form.tanggal_konsultasi, form.jam_mulai, form.jam_selesai, own_consultations)
    if conflict:
        raise ConflictError(
            f"Anda sudah memiliki konsultasi aktif pada {form.tanggal_konsultasi} jam {conflict[0]}-{conflict[1]}."
        )


def claim_case(db: Client, current_user: CurrentUser, id_bursa: int) -> dict:
    real_id_konsultan = current_user.id_konsultan

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
