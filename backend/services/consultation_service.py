import logging
import math

from fastapi import HTTPException, UploadFile
from supabase import Client

from core.config import get_settings
from core.constants import Role, StatusPengajuan
from core.exceptions import BadRequestError, ForbiddenError, InternalError, NotFoundError
from helpers.access import get_konsultan_id, require_konsultan_id, require_role
from repositories import (
    case_repository,
    consultant_repository,
    consultation_repository,
    rating_repository,
    schedule_repository,
    supporting_document_repository,
    user_repository,
)
from schemas.consultations import AssignSchedule, RatingCreate
from services.email_service import get_frontend_base_url, send_notification_email
from services.storage_service import (
    remove_file_from_supabase,
    upload_supporting_document_to_supabase,
)

logger = logging.getLogger(__name__)


def _notify_consultant_new_request(db: Client, id_konsultan: int, id_pengajuan: int) -> None:
    try:
        konsultan = consultant_repository.get_by_id_strict(db, id_konsultan, "id_user, nama_lengkap")
        if konsultan:
            user = user_repository.get_by_id_strict(db, konsultan["id_user"], "email")
            if user:
                konsultan_email = user["email"]
                konsultan_nama = konsultan["nama_lengkap"]
                subject = "Pengajuan Konsultasi Baru"
                frontend_base_url = get_frontend_base_url()
                message = f"""Halo {konsultan_nama},

Anda memiliki pengajuan konsultasi baru yang menunggu persetujuan Anda.

Silakan tinjau detail pengajuan dan tentukan tindakan Anda melalui tautan berikut:
{frontend_base_url}/request/{id_pengajuan}

Terima kasih.
"""
                send_notification_email(konsultan_email, subject, message)
    except Exception:
        pass


def _notify_client_rejected(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    try:
        client = user_repository.get_by_id_strict(db, data_pengajuan["id_user"], "email, nama")
        if client:
            client_email = client["email"]
            client_nama = client["nama"]
            subject = "Pengajuan Konsultasi Ditolak"
            message = f"Halo {client_nama}, mohon maaf, pengajuan konsultasi Anda (ID: {id_pengajuan}) telah ditolak oleh konsultan."
            send_notification_email(client_email, subject, message)
    except Exception as e:
        logger.error(f"Gagal kirim email di update_status (ditolak): {e}")


def _notify_client_awaiting_payment(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    try:
        client = user_repository.get_by_id_strict(db, data_pengajuan["id_user"], "email, nama")
        if client:
            client_email = client["email"]
            client_nama = client["nama"]
            subject = "Jadwal Konsultasi Ditetapkan - Menunggu Pembayaran"
            frontend_base_url = get_frontend_base_url()
            message = f"""Halo {client_nama},

Kabar baik! Pengajuan konsultasi Anda (ID: {id_pengajuan}) telah dikonfirmasi oleh konsultan.

Silakan lanjutkan ke tahap pembayaran untuk mengamankan slot jadwal Anda. Anda dapat melakukan pembayaran melalui tautan berikut:
{frontend_base_url}/payment/{id_pengajuan}

(Atau Anda dapat langsung mengecek menu Dashboard di aplikasi LangkahLegal).

Terima kasih.
"""
            send_notification_email(client_email, subject, message)
    except Exception as e:
        logger.error(f"Gagal kirim email di update_status (menunggu_pembayaran): {e}")


def _notify_client_schedule_assigned(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    try:
        client = user_repository.get_by_id_strict(db, data_pengajuan["id_user"], "email, nama")
        if client:
            client_email = client["email"]
            client_nama = client["nama"]
            subject = "Jadwal Konsultasi Ditetapkan - Menunggu Pembayaran"
            frontend_base_url = get_frontend_base_url()
            message = f"""Halo {client_nama},

Jadwal konsultasi Anda telah dikonfirmasi dan ditetapkan oleh konsultan (ID Pengajuan: {id_pengajuan}).

Silakan lanjutkan ke tahap pembayaran untuk mengamankan slot jadwal Anda. Anda dapat melakukan pembayaran melalui tautan berikut:
{frontend_base_url}/payment/{id_pengajuan}

(Atau Anda dapat langsung mengecek menu Dashboard di aplikasi LangkahLegal).

Terima kasih.
"""
            send_notification_email(client_email, subject, message)
    except Exception as e:
        logger.error(f"Gagal kirim email di assign-schedule: {e}")


def _notify_client_zoom_link(db: Client, id_pengajuan: int) -> None:
    try:
        pengajuan = consultation_repository.get_by_id_strict(db, id_pengajuan, "id_user")
        if pengajuan:
            client = user_repository.get_by_id_strict(db, pengajuan["id_user"], "email, nama")
            if client:
                client_email = client["email"]
                client_nama = client["nama"]
                subject = "Link Zoom Konsultasi Tersedia"
                frontend_base_url = get_frontend_base_url()
                message = f"""Halo {client_nama},

Konsultan telah membagikan link Zoom untuk sesi konsultasi Anda.
Silakan cek detail dan akses link tersebut melalui tautan berikut:
{frontend_base_url}/consultation/{id_pengajuan}

Terima kasih.
"""
                send_notification_email(client_email, subject, message)
    except Exception as e:
        logger.error(f"Gagal kirim email di zoom-link: {e}")


async def create_consultation(
    db: Client,
    current_user: dict,
    id_jadwal: int,
    deskripsi_kasus: str,
    jam_mulai: str,
    jam_selesai: str,
    dokumen_pendukung_files: list[UploadFile] | None,
) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat membuat pengajuan")

    if dokumen_pendukung_files:
        valid_files = [f for f in dokumen_pendukung_files if f.filename]
        if len(valid_files) > 10:
            raise BadRequestError("Maksimal 10 file dokumen pendukung")
    else:
        valid_files = []

    data_jadwal = schedule_repository.get_by_id(db, id_jadwal)

    if data_jadwal is None:
        raise NotFoundError("Jadwal ketersediaan tidak ditemukan")

    if jam_mulai < data_jadwal["jam_mulai"] or jam_selesai > data_jadwal["jam_selesai"]:
        raise BadRequestError(
            f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})"
        )

    created = consultation_repository.insert(db, {
        "id_user": current_user["id_user"],
        "id_konsultan": data_jadwal["id_konsultan"],
        "id_jadwal": id_jadwal,
        "tanggal_pengajuan": data_jadwal["tanggal"],
        "jam_mulai": jam_mulai,
        "jam_selesai": jam_selesai,
        "deskripsi_kasus": deskripsi_kasus,
        "status_pengajuan": StatusPengajuan.PENDING
    })

    if not created:
        raise InternalError("Gagal menyimpan data pengajuan")

    id_pengajuan = created[0]["id_pengajuan"]

    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket
    uploaded_docs = []
    failed_docs = []

    for file in valid_files:
        try:
            doc_meta = await upload_supporting_document_to_supabase(
                file=file,
                id_pengajuan=id_pengajuan,
                id_user=current_user["id_user"],
                db_client=db,
                bucket_name=bucket_name,
            )
            supporting_document_repository.insert(db, {
                "id_pengajuan": id_pengajuan,
                "nama_dokumen": doc_meta["nama_dokumen"],
                "file_url": doc_meta["file_url"],
                "tipe_file": doc_meta["tipe_file"],
                "ukuran_kb": doc_meta["ukuran_kb"],
            })
            uploaded_docs.append(doc_meta["nama_dokumen"])
        except Exception as e:
            failed_docs.append({"nama": file.filename, "alasan": str(e)})

    _notify_consultant_new_request(db, data_jadwal["id_konsultan"], id_pengajuan)

    return {
        "message": "Pengajuan berhasil dikirim.",
        "data": {
            "id_pengajuan": id_pengajuan,
            "tanggal_konsultasi": data_jadwal["tanggal"],
            "jam_diajukan": f"{jam_mulai} - {jam_selesai}",
            "status": StatusPengajuan.PENDING,
            "dokumen_terupload": uploaded_docs,
            "dokumen_gagal": failed_docs,
        }
    }


def update_status(db: Client, current_user: dict, id_pengajuan: int, new_status: str) -> dict:
    data_pengajuan = consultation_repository.get_by_id(db, id_pengajuan)

    if data_pengajuan is None:
        raise NotFoundError("Data pengajuan tidak ditemukan")

    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == Role.CLIENT:
        if new_status != StatusPengajuan.DIBATALKAN:
            raise ForbiddenError("Klien hanya diizinkan untuk membatalkan pengajuan")
        if data_pengajuan["id_user"] != user_id:
            raise ForbiddenError("Anda tidak diizinkan mengubah pengajuan orang lain")

    elif user_role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, user_id)
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
        _notify_client_rejected(db, data_pengajuan, id_pengajuan)
    elif new_status.lower() == StatusPengajuan.MENUNGGU_PEMBAYARAN:
        _notify_client_awaiting_payment(db, data_pengajuan, id_pengajuan)

    return {"message": f"Status berhasil diubah menjadi {new_status}"}


def list_my_consultations(db: Client, current_user: dict) -> dict:
    id_user = None
    id_kons = None

    if current_user["role"] == Role.CLIENT:
        id_user = current_user["id_user"]
    elif current_user["role"] == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, current_user["id_user"])

    return {"data": consultation_repository.list_with_relations(db, id_user=id_user, id_konsultan=id_kons)}


def _count_sessions(jm: str, js: str) -> int:
    jumlah_sesi = 1
    if len(jm) >= 5 and len(js) >= 5:
        try:
            start_h, start_m = int(jm[:2]), int(jm[3:5])
            end_h, end_m = int(js[:2]), int(js[3:5])
            start_total = start_h * 60 + start_m
            end_total = end_h * 60 + end_m
            diff = end_total - start_total
            if diff < 0:
                diff += 24 * 60
            calc_sesi = math.ceil(diff / 30.0)
            if calc_sesi > 0:
                jumlah_sesi = calc_sesi
        except Exception:
            pass
    return jumlah_sesi


def _bursa_documents_fallback(db: Client, id_bursa: int) -> list[dict]:
    berkas = []
    try:
        bursa = case_repository.get_by_id(db, id_bursa, "dokumen_bukti")
        if bursa and bursa.get("dokumen_bukti"):
            urls = bursa["dokumen_bukti"].split(",")
            for idx, url in enumerate(urls):
                url = url.strip()
                if url:
                    ext = url.rsplit(".", 1)[-1].lower() if "." in url else ""
                    berkas.append({
                        "id_dokumen": idx + 1,
                        "nama_dokumen": url.rsplit("/", 1)[-1] if "/" in url else f"dokumen_{idx+1}",
                        "file_url": url,
                        "tipe_file": "application/pdf" if ext == "pdf" else f"image/{ext}" if ext else "unknown",
                        "ukuran_kb": 0,
                    })
    except Exception:
        pass
    return berkas


def get_consultation_detail(db: Client, current_user: dict, id_pengajuan: int) -> dict:
    id_user = None
    id_kons = None

    if current_user.get("role") == Role.CLIENT:
        id_user = current_user["id_user"]
    elif current_user.get("role") == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, current_user["id_user"])
        if id_kons is None:
            raise ForbiddenError("Akses ditolak")
    else:
        raise ForbiddenError("Akses ditolak")

    data = consultation_repository.get_detail(db, id_pengajuan, id_user=id_user, id_konsultan=id_kons)

    if data is None:
        raise NotFoundError("Detail tidak ditemukan")

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

    jumlah_sesi = _count_sessions(jm, js)
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

    return {"data": data}


def assign_schedule(
    db: Client, current_user: dict, id_pengajuan: int, request: AssignSchedule
) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengatur jadwal")

    real_id_konsultan = require_konsultan_id(db, current_user["id_user"])

    data_pengajuan = consultation_repository.get_by_id(
        db, id_pengajuan, "id_pengajuan, id_konsultan, id_user, status_pengajuan, id_bursa"
    )
    if data_pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if data_pengajuan["id_konsultan"] != real_id_konsultan:
        raise ForbiddenError("Pengajuan ini bukan milik Anda")

    if data_pengajuan["status_pengajuan"] != StatusPengajuan.PENDING:
        raise BadRequestError("Hanya pengajuan berstatus pending yang bisa dijadwalkan")

    data_jadwal = schedule_repository.get_by_id(
        db,
        request.id_jadwal,
        "id_jadwal, id_konsultan, tanggal, jam_mulai, jam_selesai, status_tersedia",
    )
    if data_jadwal is None:
        raise NotFoundError("Jadwal tidak ditemukan")

    if data_jadwal["id_konsultan"] != real_id_konsultan:
        raise ForbiddenError("Jadwal ini bukan milik Anda")

    if not data_jadwal["status_tersedia"]:
        raise BadRequestError("Slot jadwal sudah tidak tersedia")

    if request.jam_mulai < data_jadwal["jam_mulai"] or request.jam_selesai > data_jadwal["jam_selesai"]:
        raise BadRequestError(
            f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})"
        )

    updated = consultation_repository.update(db, id_pengajuan, {
        "id_jadwal": request.id_jadwal,
        "tanggal_pengajuan": data_jadwal["tanggal"],
        "jam_mulai": request.jam_mulai,
        "jam_selesai": request.jam_selesai,
        "status_pengajuan": StatusPengajuan.MENUNGGU_PEMBAYARAN,
    })

    if not updated:
        raise InternalError("Gagal mengatur jadwal")

    schedule_repository.set_available(db, request.id_jadwal, False)

    _notify_client_schedule_assigned(db, data_pengajuan, id_pengajuan)

    return {
        "message": "Jadwal berhasil diatur. Status berubah ke menunggu_pembayaran.",
        "data": updated[0],
    }


def update_zoom_link(db: Client, current_user: dict, id_pengajuan: int, link_zoom: str) -> dict:
    require_role(current_user, Role.KONSULTAN, "Hanya konsultan yang bisa mengatur link Zoom")

    id_kons = require_konsultan_id(db, current_user["id_user"])

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

    _notify_client_zoom_link(db, id_pengajuan)

    return {
        "message": "Link Zoom berhasil disimpan",
        "data": {"link_zoom": link_zoom.strip()},
    }


def mark_completed(db: Client, current_user: dict, id_pengajuan: int) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang bisa menandai konsultasi selesai")

    user_id = current_user["id_user"]

    pengajuan = consultation_repository.get_by_id_strict(db, id_pengajuan, "id_user, status_pengajuan")

    if not pengajuan:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if pengajuan["id_user"] != user_id:
        raise ForbiddenError("Akses ditolak: Pengajuan ini bukan milik Anda")

    if pengajuan["status_pengajuan"] != StatusPengajuan.TERJADWAL:
        raise BadRequestError("Hanya pengajuan dengan status 'terjadwal' yang bisa diselesaikan")

    updated = consultation_repository.update(
        db, id_pengajuan, {"status_pengajuan": StatusPengajuan.SELESAI}
    )

    if not updated:
        raise InternalError("Gagal menandai konsultasi selesai")

    return {"message": "Konsultasi berhasil ditandai selesai!"}


def get_booked_slots(db: Client, id_konsultan: int) -> dict:
    return {
        "message": "Data jadwal terisi ditemukan",
        "data": consultation_repository.list_by_konsultan_and_statuses(
            db,
            id_konsultan,
            [StatusPengajuan.TERJADWAL],
            "jam_mulai, jam_selesai, tanggal_pengajuan",
        ),
    }


def list_documents(db: Client, current_user: dict, id_pengajuan: int) -> dict:
    data_pengajuan = consultation_repository.get_by_id(db, id_pengajuan, "id_user, id_konsultan")
    if data_pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == Role.CLIENT:
        if data_pengajuan["id_user"] != user_id:
            raise ForbiddenError("Akses ditolak")
    elif user_role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, user_id)
        if id_kons is None or data_pengajuan["id_konsultan"] != id_kons:
            raise ForbiddenError("Akses ditolak")
    else:
        raise ForbiddenError("Role tidak dikenali")

    docs = supporting_document_repository.list_by_pengajuan(db, id_pengajuan)

    return {
        "message": "Dokumen berhasil dimuat",
        "total": len(docs),
        "data": docs
    }


def _require_owned_consultation(db: Client, id_pengajuan: int, id_user: int, forbidden_detail: str) -> None:
    pengajuan = consultation_repository.get_by_id(db, id_pengajuan, "id_user")
    if pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")
    if pengajuan["id_user"] != id_user:
        raise ForbiddenError(forbidden_detail)


async def upload_documents(
    db: Client,
    current_user: dict,
    id_pengajuan: int,
    dokumen_pendukung_files: list[UploadFile],
) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat mengunggah dokumen")

    _require_owned_consultation(
        db,
        id_pengajuan,
        current_user["id_user"],
        "Anda tidak berhak mengunggah dokumen untuk pengajuan ini",
    )

    valid_files = [f for f in dokumen_pendukung_files if f.filename]
    if not valid_files:
        raise BadRequestError("Tidak ada file valid yang dikirim")
    if len(valid_files) > 10:
        raise BadRequestError("Maksimal 10 file per upload")

    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket
    uploaded_docs = []
    failed_docs = []

    for file in valid_files:
        try:
            doc_meta = await upload_supporting_document_to_supabase(
                file=file,
                id_pengajuan=id_pengajuan,
                id_user=current_user["id_user"],
                db_client=db,
                bucket_name=bucket_name,
            )
            inserted = supporting_document_repository.insert(db, {
                "id_pengajuan": id_pengajuan,
                "nama_dokumen": doc_meta["nama_dokumen"],
                "file_url": doc_meta["file_url"],
                "tipe_file": doc_meta["tipe_file"],
                "ukuran_kb": doc_meta["ukuran_kb"],
            })

            uploaded_docs.append({
                "id_dokumen": inserted[0]["id_dokumen"] if inserted else None,
                "nama_dokumen": doc_meta["nama_dokumen"],
                "file_url": doc_meta["file_url"],
                "tipe_file": doc_meta["tipe_file"],
                "ukuran_kb": doc_meta["ukuran_kb"],
            })
        except HTTPException as e:
            failed_docs.append({"nama": file.filename, "alasan": e.detail})
        except Exception as e:
            failed_docs.append({"nama": file.filename, "alasan": str(e)})

    return {
        "message": f"{len(uploaded_docs)} dokumen berhasil diupload",
        "data": {
            "dokumen_terupload": uploaded_docs,
            "dokumen_gagal": failed_docs,
        }
    }


def delete_document(db: Client, current_user: dict, id_pengajuan: int, id_dokumen: int) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat menghapus dokumen")

    _require_owned_consultation(
        db,
        id_pengajuan,
        current_user["id_user"],
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


def submit_rating(
    db: Client, current_user: dict, id_pengajuan: int, rating_data: RatingCreate
) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang dapat memberikan rating")

    user_id = current_user.get("id_user")

    data_pengajuan = consultation_repository.get_by_id(
        db, id_pengajuan, "id_user, id_konsultan, status_pengajuan"
    )

    if data_pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if data_pengajuan["id_user"] != user_id:
        raise ForbiddenError("Anda tidak berhak memberi rating pada pengajuan orang lain")

    if data_pengajuan["status_pengajuan"] not in [StatusPengajuan.TERJADWAL, StatusPengajuan.SELESAI]:
        raise BadRequestError("Rating hanya dapat diberikan untuk sesi yang sedang berjalan (terjadwal) atau sudah selesai.")

    if rating_repository.list_by_pengajuan(db, id_pengajuan):
        raise BadRequestError("Anda sudah memberikan ulasan untuk sesi konsultasi ini.")

    inserted = rating_repository.insert(db, {
        "id_pengajuan": id_pengajuan,
        "id_konsultan": data_pengajuan["id_konsultan"],
        "skor_rating": rating_data.skor_rating,
        "ulasan_teks": rating_data.ulasan_teks,
    })

    if not inserted:
        raise InternalError("Gagal menyimpan ulasan")

    if data_pengajuan["status_pengajuan"] != StatusPengajuan.SELESAI:
        consultation_repository.update(db, id_pengajuan, {"status_pengajuan": StatusPengajuan.SELESAI})

    return {"message": "Ulasan berhasil dikirim dan konsultasi telah selesai.", "data": inserted[0]}
