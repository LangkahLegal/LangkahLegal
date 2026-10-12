import logging

from fastapi import UploadFile
from supabase import Client

from core.config import get_settings
from core.constants import Role, StatusPengajuan
from core.exceptions import BadRequestError, ForbiddenError, InternalError, NotFoundError
from core.user import CurrentUser
from helpers.access import get_konsultan_id, require_konsultan_id, require_role
from helpers.schedule import count_sessions, ensure_within_schedule
from repositories import (
    case_repository,
    consultation_repository,
    rating_repository,
    schedule_repository,
    supporting_document_repository,
)
from schemas.consultations import AssignSchedule, ConsultationForm, RatingCreate
from services import notification_service
from services.storage_service import (
    remove_file_from_supabase,
    select_valid_files,
    upload_supporting_documents,
)

logger = logging.getLogger(__name__)


async def create_consultation(db: Client, current_user: CurrentUser, form: ConsultationForm) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat membuat pengajuan")

    valid_files = select_valid_files(form.dokumen_pendukung_files, "Maksimal 10 file dokumen pendukung")

    data_jadwal = schedule_repository.get_by_id(db, form.id_jadwal)

    if data_jadwal is None:
        raise NotFoundError("Jadwal ketersediaan tidak ditemukan")

    ensure_within_schedule(form.jam_mulai, form.jam_selesai, data_jadwal)

    created = consultation_repository.insert(
        db,
        {
            "id_user": current_user.id_user,
            "id_konsultan": data_jadwal["id_konsultan"],
            "id_jadwal": form.id_jadwal,
            "tanggal_pengajuan": data_jadwal["tanggal"],
            "jam_mulai": form.jam_mulai,
            "jam_selesai": form.jam_selesai,
            "deskripsi_kasus": form.deskripsi_kasus,
            "status_pengajuan": StatusPengajuan.PENDING,
        },
    )

    if not created:
        raise InternalError("Gagal menyimpan data pengajuan")

    id_pengajuan = created[0]["id_pengajuan"]

    def save_document(doc_meta: dict) -> str:
        _insert_document(db, id_pengajuan, doc_meta)
        return doc_meta["nama_dokumen"]

    uploaded_docs, failed_docs = await upload_supporting_documents(
        db, valid_files, id_pengajuan, current_user.id_user, save_document
    )

    notification_service.consultant_new_request(db, data_jadwal["id_konsultan"], id_pengajuan)

    return {
        "message": "Pengajuan berhasil dikirim.",
        "data": {
            "id_pengajuan": id_pengajuan,
            "tanggal_konsultasi": data_jadwal["tanggal"],
            "jam_diajukan": f"{form.jam_mulai} - {form.jam_selesai}",
            "status": StatusPengajuan.PENDING,
            "dokumen_terupload": uploaded_docs,
            "dokumen_gagal": failed_docs,
        },
    }


def update_status(db: Client, current_user: CurrentUser, id_pengajuan: int, new_status: str) -> dict:
    data_pengajuan = consultation_repository.get_by_id(db, id_pengajuan)

    if data_pengajuan is None:
        raise NotFoundError("Data pengajuan tidak ditemukan")

    user_role = current_user.role
    user_id = current_user.id_user

    if user_role == Role.CLIENT:
        if new_status != StatusPengajuan.DIBATALKAN:
            raise ForbiddenError("Klien hanya diizinkan untuk membatalkan pengajuan")
        if data_pengajuan["id_user"] != user_id:
            raise ForbiddenError("Anda tidak diizinkan mengubah pengajuan orang lain")

    elif user_role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, current_user)
        if id_kons is None or data_pengajuan["id_konsultan"] != id_kons:
            raise ForbiddenError("Akses ditolak: Pengajuan ini bukan milik Anda")

    else:
        raise ForbiddenError("Role tidak dikenali")

    if new_status.lower() in [StatusPengajuan.DITOLAK, StatusPengajuan.DIBATALKAN]:
        if data_pengajuan.get("id_jadwal"):
            schedule_repository.set_available(db, data_pengajuan["id_jadwal"], True)

    updated = consultation_repository.update(db, id_pengajuan, {"status_pengajuan": new_status})

    if not updated:
        raise InternalError("Gagal memperbarui status")

    if new_status.lower() == StatusPengajuan.DITOLAK:
        notification_service.client_request_rejected(db, data_pengajuan, id_pengajuan)
    elif new_status.lower() == StatusPengajuan.MENUNGGU_PEMBAYARAN:
        notification_service.client_awaiting_payment(db, data_pengajuan, id_pengajuan)

    return {"message": f"Status berhasil diubah menjadi {new_status}"}


def list_my_consultations(db: Client, current_user: CurrentUser) -> dict:
    id_user = None
    id_kons = None

    if current_user.role == Role.CLIENT:
        id_user = current_user.id_user
    elif current_user.role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, current_user)

    return {"data": consultation_repository.list_with_relations(db, id_user=id_user, id_konsultan=id_kons)}


def _bursa_documents_fallback(db: Client, id_bursa: int) -> list[dict]:
    berkas = []
    try:
        bursa = case_repository.get_by_id(db, id_bursa)
        if bursa and bursa.get("dokumen_bukti"):
            urls = bursa["dokumen_bukti"].split(",")
            for idx, url in enumerate(urls):
                url = url.strip()
                if url:
                    ext = url.rsplit(".", 1)[-1].lower() if "." in url else ""
                    berkas.append(
                        {
                            "id_dokumen": idx + 1,
                            "nama_dokumen": url.rsplit("/", 1)[-1] if "/" in url else f"dokumen_{idx + 1}",
                            "file_url": url,
                            "tipe_file": "application/pdf" if ext == "pdf" else f"image/{ext}" if ext else "unknown",
                            "ukuran_kb": 0,
                        }
                    )
    except Exception as e:
        logger.warning(f"Gagal memuat dokumen bursa {id_bursa}: {e}")
    return berkas


def _detail_scope(db: Client, current_user: CurrentUser) -> tuple[int | None, int | None]:
    if current_user.role == Role.CLIENT:
        return current_user.id_user, None

    if current_user.role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, current_user)
        if id_kons is not None:
            return None, id_kons

    raise ForbiddenError("Akses ditolak")


def get_consultation_detail(db: Client, current_user: CurrentUser, id_pengajuan: int) -> dict:
    id_user, id_kons = _detail_scope(db, current_user)

    data = consultation_repository.get_detail(db, id_pengajuan, id_user=id_user, id_konsultan=id_kons)

    if data is None:
        raise NotFoundError("Detail tidak ditemukan")

    return {"data": _enrich_detail(db, data)}


def _enrich_detail(db: Client, data: dict) -> dict:
    jadwal = data.get("jadwal_ketersediaan") or {}
    konsultan_via_jadwal = jadwal.get("konsultan") or {}
    konsultan_direct = data.get("konsultan") or {}
    user_info = data.get("users") or {}
    docs = data.get("dokumen_pendukung") or []

    data["nama_klien"] = user_info.get("nama")
    data["foto_profil"] = user_info.get("foto_profil")
    data["tanggal_pengajuan"] = data.get("tanggal_pengajuan") or data.get("created_at")
    data["tanggal_konsultasi"] = jadwal.get("tanggal") or str(data.get("tanggal_pengajuan", ""))[:10]

    jm = str(data.get("jam_mulai", ""))[:5]
    js = str(data.get("jam_selesai", ""))[:5]
    data["rentang_waktu"] = f"{jm} - {js}" if jm and js else ""

    jumlah_sesi = count_sessions(jm, js)
    data["jumlah_sesi"] = jumlah_sesi

    tarif_skrg = konsultan_via_jadwal.get("tarif_per_sesi") or konsultan_direct.get("tarif_per_sesi", 0)
    tarif_skrg = int(tarif_skrg) if tarif_skrg else 0
    data["total_harga"] = tarif_skrg * jumlah_sesi

    data["link_dokumen"] = data.get("link_dokumen") or (docs[0].get("file_url") if len(docs) > 0 else None)

    data["link_zoom"] = data.get("link_zoom")

    berkas = [
        {
            "id_dokumen": d.get("id_dokumen"),
            "nama_dokumen": d.get("nama_dokumen"),
            "file_url": d.get("file_url"),
            "tipe_file": d.get("tipe_file"),
            "ukuran_kb": d.get("ukuran_kb"),
        }
        for d in docs
    ]

    if not berkas and data.get("id_bursa"):
        berkas = _bursa_documents_fallback(db, data["id_bursa"])

    data["berkas_pendukung"] = berkas

    return data


def _get_pending_consultation_of(db: Client, id_pengajuan: int, id_konsultan: int) -> dict:
    data_pengajuan = consultation_repository.get_summary(db, id_pengajuan)
    if data_pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if data_pengajuan["id_konsultan"] != id_konsultan:
        raise ForbiddenError("Pengajuan ini bukan milik Anda")

    if data_pengajuan["status_pengajuan"] != StatusPengajuan.PENDING:
        raise BadRequestError("Hanya pengajuan berstatus pending yang bisa dijadwalkan")

    return data_pengajuan


def _get_available_schedule_of(db: Client, id_jadwal: int, id_konsultan: int) -> dict:
    data_jadwal = schedule_repository.get_by_id(db, id_jadwal)
    if data_jadwal is None:
        raise NotFoundError("Jadwal tidak ditemukan")

    if data_jadwal["id_konsultan"] != id_konsultan:
        raise ForbiddenError("Jadwal ini bukan milik Anda")

    if not data_jadwal["status_tersedia"]:
        raise BadRequestError("Slot jadwal sudah tidak tersedia")

    return data_jadwal


def assign_schedule(db: Client, current_user: CurrentUser, id_pengajuan: int, request: AssignSchedule) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengatur jadwal")

    real_id_konsultan = require_konsultan_id(db, current_user)

    data_pengajuan = _get_pending_consultation_of(db, id_pengajuan, real_id_konsultan)
    data_jadwal = _get_available_schedule_of(db, request.id_jadwal, real_id_konsultan)

    ensure_within_schedule(request.jam_mulai, request.jam_selesai, data_jadwal)

    updated = consultation_repository.update(
        db,
        id_pengajuan,
        {
            "id_jadwal": request.id_jadwal,
            "tanggal_pengajuan": data_jadwal["tanggal"],
            "jam_mulai": request.jam_mulai,
            "jam_selesai": request.jam_selesai,
            "status_pengajuan": StatusPengajuan.MENUNGGU_PEMBAYARAN,
        },
    )

    if not updated:
        raise InternalError("Gagal mengatur jadwal")

    schedule_repository.set_available(db, request.id_jadwal, False)

    notification_service.client_schedule_assigned(db, data_pengajuan, id_pengajuan)

    return {
        "message": "Jadwal berhasil diatur. Status berubah ke menunggu_pembayaran.",
        "data": updated[0],
    }


def update_zoom_link(db: Client, current_user: CurrentUser, id_pengajuan: int, link_zoom: str) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengatur link Zoom")

    id_kons = require_konsultan_id(db, current_user)

    pengajuan = consultation_repository.get_for_konsultan(db, id_pengajuan, id_kons)

    if pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan atau bukan milik Anda")

    if pengajuan["status_pengajuan"] not in [
        StatusPengajuan.TERJADWAL,
        StatusPengajuan.MENUNGGU_PEMBAYARAN,
        StatusPengajuan.SELESAI,
    ]:
        raise BadRequestError("Link Zoom hanya bisa diatur untuk sesi yang relevan")

    updated = consultation_repository.update(db, id_pengajuan, {"link_zoom": link_zoom.strip()})

    if not updated:
        raise InternalError("Gagal menyimpan link Zoom")

    notification_service.client_zoom_link(db, id_pengajuan)

    return {
        "message": "Link Zoom berhasil disimpan",
        "data": {"link_zoom": link_zoom.strip()},
    }


def mark_completed(db: Client, current_user: CurrentUser, id_pengajuan: int) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang bisa menandai konsultasi selesai")

    user_id = current_user.id_user

    pengajuan = consultation_repository.get_summary_strict(db, id_pengajuan)

    if not pengajuan:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if pengajuan["id_user"] != user_id:
        raise ForbiddenError("Akses ditolak: Pengajuan ini bukan milik Anda")

    if pengajuan["status_pengajuan"] != StatusPengajuan.TERJADWAL:
        raise BadRequestError("Hanya pengajuan dengan status 'terjadwal' yang bisa diselesaikan")

    updated = consultation_repository.update(db, id_pengajuan, {"status_pengajuan": StatusPengajuan.SELESAI})

    if not updated:
        raise InternalError("Gagal menandai konsultasi selesai")

    return {"message": "Konsultasi berhasil ditandai selesai!"}


def get_booked_slots(db: Client, id_konsultan: int) -> dict:
    return {
        "message": "Data jadwal terisi ditemukan",
        "data": consultation_repository.list_booked_slots(db, id_konsultan, [StatusPengajuan.TERJADWAL]),
    }


def list_documents(db: Client, current_user: CurrentUser, id_pengajuan: int) -> dict:
    data_pengajuan = consultation_repository.get_summary(db, id_pengajuan)
    if data_pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    user_role = current_user.role
    user_id = current_user.id_user

    if user_role == Role.CLIENT:
        if data_pengajuan["id_user"] != user_id:
            raise ForbiddenError("Akses ditolak")
    elif user_role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, current_user)
        if id_kons is None or data_pengajuan["id_konsultan"] != id_kons:
            raise ForbiddenError("Akses ditolak")
    else:
        raise ForbiddenError("Role tidak dikenali")

    docs = supporting_document_repository.list_by_pengajuan(db, id_pengajuan)

    return {"message": "Dokumen berhasil dimuat", "total": len(docs), "data": docs}


def _insert_document(db: Client, id_pengajuan: int, doc_meta: dict) -> list[dict]:
    return supporting_document_repository.insert(
        db,
        {
            "id_pengajuan": id_pengajuan,
            "nama_dokumen": doc_meta["nama_dokumen"],
            "file_url": doc_meta["file_url"],
            "tipe_file": doc_meta["tipe_file"],
            "ukuran_kb": doc_meta["ukuran_kb"],
        },
    )


def _require_owned_consultation(db: Client, id_pengajuan: int, id_user: int, forbidden_detail: str) -> None:
    pengajuan = consultation_repository.get_summary(db, id_pengajuan)
    if pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")
    if pengajuan["id_user"] != id_user:
        raise ForbiddenError(forbidden_detail)


async def upload_documents(
    db: Client,
    current_user: CurrentUser,
    id_pengajuan: int,
    dokumen_pendukung_files: list[UploadFile],
) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat mengunggah dokumen")

    _require_owned_consultation(
        db,
        id_pengajuan,
        current_user.id_user,
        "Anda tidak berhak mengunggah dokumen untuk pengajuan ini",
    )

    valid_files = select_valid_files(
        dokumen_pendukung_files,
        "Maksimal 10 file per upload",
        empty_detail="Tidak ada file valid yang dikirim",
    )

    def save_document(doc_meta: dict) -> dict:
        inserted = _insert_document(db, id_pengajuan, doc_meta)
        return {"id_dokumen": inserted[0]["id_dokumen"] if inserted else None, **doc_meta}

    uploaded_docs, failed_docs = await upload_supporting_documents(
        db, valid_files, id_pengajuan, current_user.id_user, save_document, detail_only=True
    )

    return {
        "message": f"{len(uploaded_docs)} dokumen berhasil diupload",
        "data": {
            "dokumen_terupload": uploaded_docs,
            "dokumen_gagal": failed_docs,
        },
    }


def delete_document(db: Client, current_user: CurrentUser, id_pengajuan: int, id_dokumen: int) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat menghapus dokumen")

    _require_owned_consultation(
        db,
        id_pengajuan,
        current_user.id_user,
        "Anda tidak berhak menghapus dokumen untuk pengajuan ini",
    )

    doc_data = supporting_document_repository.get(db, id_dokumen, id_pengajuan)
    if doc_data is None:
        raise NotFoundError("Dokumen tidak ditemukan")

    file_url = doc_data.get("file_url", "")

    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket

    try:
        if f"/storage/v1/object/public/{bucket_name}/" in file_url:
            storage_path = file_url.split(f"/storage/v1/object/public/{bucket_name}/")[1]
            remove_file_from_supabase(db, bucket_name, storage_path)
    except Exception as e:
        logger.warning(f"Gagal hapus file dari storage: {e}")

    supporting_document_repository.delete(db, id_dokumen)

    return {"message": "Dokumen berhasil dihapus", "id_dokumen": id_dokumen}


def submit_rating(db: Client, current_user: CurrentUser, id_pengajuan: int, rating_data: RatingCreate) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat memberikan rating")

    user_id = current_user.id_user

    data_pengajuan = consultation_repository.get_summary(db, id_pengajuan)

    if data_pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if data_pengajuan["id_user"] != user_id:
        raise ForbiddenError("Anda tidak berhak memberi rating pada pengajuan orang lain")

    if data_pengajuan["status_pengajuan"] not in [StatusPengajuan.TERJADWAL, StatusPengajuan.SELESAI]:
        raise BadRequestError(
            "Rating hanya dapat diberikan untuk sesi yang sedang berjalan (terjadwal) atau sudah selesai."
        )

    if rating_repository.list_by_pengajuan(db, id_pengajuan):
        raise BadRequestError("Anda sudah memberikan ulasan untuk sesi konsultasi ini.")

    inserted = rating_repository.insert(
        db,
        {
            "id_pengajuan": id_pengajuan,
            "id_konsultan": data_pengajuan["id_konsultan"],
            "skor_rating": rating_data.skor_rating,
            "ulasan_teks": rating_data.ulasan_teks,
        },
    )

    if not inserted:
        raise InternalError("Gagal menyimpan ulasan")

    if data_pengajuan["status_pengajuan"] != StatusPengajuan.SELESAI:
        consultation_repository.update(db, id_pengajuan, {"status_pengajuan": StatusPengajuan.SELESAI})

    return {"message": "Ulasan berhasil dikirim dan konsultasi telah selesai.", "data": inserted[0]}
