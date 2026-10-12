import math

from fastapi import HTTPException, UploadFile
from supabase import Client

from config import get_settings
from exceptions import BadRequestError, ForbiddenError, InternalError, NotFoundError
from schemas.consultations import AssignSchedule, RatingCreate
from services.email_service import get_frontend_base_url, send_notification_email
from services.storage_service import upload_supporting_document_to_supabase


def _notify_consultant_new_request(db: Client, id_konsultan: int, id_pengajuan: int) -> None:
    try:
        konsultan_res = db.table("konsultan").select("id_user, nama_lengkap").eq("id_konsultan", id_konsultan).single().execute()
        if konsultan_res.data:
            user_res = db.table("users").select("email").eq("id_user", konsultan_res.data["id_user"]).single().execute()
            if user_res.data:
                konsultan_email = user_res.data["email"]
                konsultan_nama = konsultan_res.data["nama_lengkap"]
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
        client_res = db.table("users").select("email, nama").eq("id_user", data_pengajuan["id_user"]).single().execute()
        if client_res.data:
            client_email = client_res.data["email"]
            client_nama = client_res.data["nama"]
            subject = "Pengajuan Konsultasi Ditolak"
            message = f"Halo {client_nama}, mohon maaf, pengajuan konsultasi Anda (ID: {id_pengajuan}) telah ditolak oleh konsultan."
            send_notification_email(client_email, subject, message)
    except Exception as e:
        print(f"[EMAIL ERROR] Gagal kirim email di update_status (ditolak): {e}")


def _notify_client_awaiting_payment(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    try:
        client_res = db.table("users").select("email, nama").eq("id_user", data_pengajuan["id_user"]).single().execute()
        if client_res.data:
            client_email = client_res.data["email"]
            client_nama = client_res.data["nama"]
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
        print(f"[EMAIL ERROR] Gagal kirim email di update_status (menunggu_pembayaran): {e}")


def _notify_client_schedule_assigned(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    try:
        client_res = db.table("users").select("email, nama").eq("id_user", data_pengajuan["id_user"]).single().execute()
        if client_res.data:
            client_email = client_res.data["email"]
            client_nama = client_res.data["nama"]
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
        print(f"[EMAIL ERROR] Gagal kirim email di assign-schedule: {e}")


def _notify_client_zoom_link(db: Client, id_pengajuan: int) -> None:
    try:
        pengajuan = db.table("pengajuan_konsultasi").select("id_user").eq("id_pengajuan", id_pengajuan).single().execute()
        if pengajuan.data:
            client_res = db.table("users").select("email, nama").eq("id_user", pengajuan.data["id_user"]).single().execute()
            if client_res.data:
                client_email = client_res.data["email"]
                client_nama = client_res.data["nama"]
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
        print(f"[EMAIL ERROR] Gagal kirim email di zoom-link: {e}")


async def create_consultation(
    db: Client,
    current_user: dict,
    id_jadwal: int,
    deskripsi_kasus: str,
    jam_mulai: str,
    jam_selesai: str,
    dokumen_pendukung_files: list[UploadFile] | None,
) -> dict:
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang dapat membuat pengajuan")

    if dokumen_pendukung_files:
        valid_files = [f for f in dokumen_pendukung_files if f.filename]
        if len(valid_files) > 10:
            raise BadRequestError("Maksimal 10 file dokumen pendukung")
    else:
        valid_files = []

    jadwal = db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()

    if not jadwal.data:
        raise NotFoundError("Jadwal ketersediaan tidak ditemukan")

    data_jadwal = jadwal.data[0]

    if jam_mulai < data_jadwal["jam_mulai"] or jam_selesai > data_jadwal["jam_selesai"]:
        raise BadRequestError(
            f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})"
        )

    new_pengajuan = {
        "id_user": current_user["id_user"],
        "id_konsultan": data_jadwal["id_konsultan"],
        "id_jadwal": id_jadwal,
        "tanggal_pengajuan": data_jadwal["tanggal"],
        "jam_mulai": jam_mulai,
        "jam_selesai": jam_selesai,
        "deskripsi_kasus": deskripsi_kasus,
        "status_pengajuan": "pending"
    }

    res_pengajuan = db.table("pengajuan_konsultasi").insert(new_pengajuan).execute()

    if not res_pengajuan.data:
        raise InternalError("Gagal menyimpan data pengajuan")

    id_pengajuan = res_pengajuan.data[0]["id_pengajuan"]

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
            db.table("dokumen_pendukung").insert({
                "id_pengajuan": id_pengajuan,
                "nama_dokumen": doc_meta["nama_dokumen"],
                "file_url": doc_meta["file_url"],
                "tipe_file": doc_meta["tipe_file"],
                "ukuran_kb": doc_meta["ukuran_kb"],
            }).execute()
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
            "status": "pending",
            "dokumen_terupload": uploaded_docs,
            "dokumen_gagal": failed_docs,
        }
    }


def update_status(db: Client, current_user: dict, id_pengajuan: int, new_status: str) -> dict:
    pengajuan_res = db.table("pengajuan_konsultasi").select("*").eq("id_pengajuan", id_pengajuan).execute()

    if not pengajuan_res.data:
        raise NotFoundError("Data pengajuan tidak ditemukan")

    data_pengajuan = pengajuan_res.data[0]
    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == "client":
        if new_status != "dibatalkan":
            raise ForbiddenError("Klien hanya diizinkan untuk membatalkan pengajuan")
        if data_pengajuan["id_user"] != user_id:
            raise ForbiddenError("Anda tidak diizinkan mengubah pengajuan orang lain")

    elif user_role == "konsultan":
        kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", user_id).single().execute()
        if not kons_profile.data or data_pengajuan["id_konsultan"] != kons_profile.data["id_konsultan"]:
             raise ForbiddenError("Akses ditolak: Pengajuan ini bukan milik Anda")

    else:
        raise ForbiddenError("Role tidak dikenali")

    if new_status.lower() in ["ditolak", "dibatalkan"]:
        if data_pengajuan.get("id_jadwal"):
            db.table("jadwal_ketersediaan")\
                .update({"status_tersedia": True})\
                .eq("id_jadwal", data_pengajuan["id_jadwal"])\
                .execute()

    response = db.table("pengajuan_konsultasi")\
        .update({"status_pengajuan": new_status})\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    if not response.data:
        raise InternalError("Gagal memperbarui status")

    if new_status.lower() == "ditolak":
        _notify_client_rejected(db, data_pengajuan, id_pengajuan)
    elif new_status.lower() == "menunggu_pembayaran":
        _notify_client_awaiting_payment(db, data_pengajuan, id_pengajuan)

    return {"message": f"Status berhasil diubah menjadi {new_status}"}


def list_my_consultations(db: Client, current_user: dict) -> dict:
    query = db.table("pengajuan_konsultasi").select("""
        *,
        dokumen_pendukung (
            id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at
        ),
        konsultan (
            nama_lengkap, spesialisasi, foto_profil
        ),
        jadwal_ketersediaan (
            tanggal, jam_mulai, jam_selesai,
            konsultan (
                nama_lengkap, spesialisasi, foto_profil
            )
        )
    """)

    if current_user["role"] == "client":
        query = query.eq("id_user", current_user["id_user"])
    elif current_user["role"] == "konsultan":
        kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", current_user["id_user"]).single().execute()
        if kons_profile.data:
            query = query.eq("id_konsultan", kons_profile.data["id_konsultan"])

    response = query.execute()
    return {"data": response.data}


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
        bursa_data = db.table("bursa_kasus").select("dokumen_bukti").eq("id_bursa", id_bursa).execute()
        if bursa_data.data and bursa_data.data[0].get("dokumen_bukti"):
            urls = bursa_data.data[0]["dokumen_bukti"].split(",")
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
    query = db.table("pengajuan_konsultasi")\
        .select("""
            *,
            jadwal_ketersediaan(
                *,
                konsultan(nama_lengkap, tarif_per_sesi, foto_profil, spesialisasi)
            ),
            konsultan(nama_lengkap, tarif_per_sesi, foto_profil, spesialisasi),
            users(nama, email, foto_profil),
            dokumen_pendukung(id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at)
        """)\
        .eq("id_pengajuan", id_pengajuan)

    if current_user.get("role") == "client":
        query = query.eq("id_user", current_user["id_user"])
    elif current_user.get("role") == "konsultan":
        kons_profile = db.table("konsultan").select("id_konsultan")\
            .eq("id_user", current_user["id_user"]).single().execute()
        if not kons_profile.data:
            raise ForbiddenError("Akses ditolak")
        query = query.eq("id_konsultan", kons_profile.data["id_konsultan"])
    else:
        raise ForbiddenError("Akses ditolak")

    response = query.execute()

    if not response.data:
        raise NotFoundError("Detail tidak ditemukan")

    data = response.data[0]

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
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya konsultan yang bisa mengatur jadwal")

    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    if not kons_profile.data:
        raise NotFoundError("Profil konsultan tidak ditemukan")

    real_id_konsultan = kons_profile.data["id_konsultan"]

    pengajuan = (
        db.table("pengajuan_konsultasi")
        .select("id_pengajuan, id_konsultan, id_user, status_pengajuan, id_bursa")
        .eq("id_pengajuan", id_pengajuan)
        .execute()
    )
    if not pengajuan.data:
        raise NotFoundError("Pengajuan tidak ditemukan")

    data_pengajuan = pengajuan.data[0]

    if data_pengajuan["id_konsultan"] != real_id_konsultan:
        raise ForbiddenError("Pengajuan ini bukan milik Anda")

    if data_pengajuan["status_pengajuan"] != "pending":
        raise BadRequestError("Hanya pengajuan berstatus pending yang bisa dijadwalkan")

    jadwal = (
        db.table("jadwal_ketersediaan")
        .select("id_jadwal, id_konsultan, tanggal, jam_mulai, jam_selesai, status_tersedia")
        .eq("id_jadwal", request.id_jadwal)
        .execute()
    )
    if not jadwal.data:
        raise NotFoundError("Jadwal tidak ditemukan")

    data_jadwal = jadwal.data[0]

    if data_jadwal["id_konsultan"] != real_id_konsultan:
        raise ForbiddenError("Jadwal ini bukan milik Anda")

    if not data_jadwal["status_tersedia"]:
        raise BadRequestError("Slot jadwal sudah tidak tersedia")

    if request.jam_mulai < data_jadwal["jam_mulai"] or request.jam_selesai > data_jadwal["jam_selesai"]:
        raise BadRequestError(
            f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})"
        )

    update_data = {
        "id_jadwal": request.id_jadwal,
        "tanggal_pengajuan": data_jadwal["tanggal"],
        "jam_mulai": request.jam_mulai,
        "jam_selesai": request.jam_selesai,
        "status_pengajuan": "menunggu_pembayaran",
    }

    response = (
        db.table("pengajuan_konsultasi")
        .update(update_data)
        .eq("id_pengajuan", id_pengajuan)
        .execute()
    )

    if not response.data:
        raise InternalError("Gagal mengatur jadwal")

    db.table("jadwal_ketersediaan").update({"status_tersedia": False}).eq(
        "id_jadwal", request.id_jadwal
    ).execute()

    _notify_client_schedule_assigned(db, data_pengajuan, id_pengajuan)

    return {
        "message": "Jadwal berhasil diatur. Status berubah ke menunggu_pembayaran.",
        "data": response.data[0],
    }


def update_zoom_link(db: Client, current_user: dict, id_pengajuan: int, link_zoom: str) -> dict:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya konsultan yang bisa mengatur link Zoom")

    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    if not kons_profile.data:
        raise NotFoundError("Profil konsultan tidak ditemukan")

    pengajuan = (
        db.table("pengajuan_konsultasi")
        .select("id_pengajuan, id_konsultan, status_pengajuan")
        .eq("id_pengajuan", id_pengajuan)
        .eq("id_konsultan", kons_profile.data["id_konsultan"])
        .execute()
    )

    if not pengajuan.data:
        raise NotFoundError("Pengajuan tidak ditemukan atau bukan milik Anda")

    if pengajuan.data[0]["status_pengajuan"] not in ["terjadwal", "menunggu_pembayaran", "selesai"]:
        raise BadRequestError("Link Zoom hanya bisa diatur untuk sesi yang relevan")

    response = (
        db.table("pengajuan_konsultasi")
        .update({"link_zoom": link_zoom.strip()})
        .eq("id_pengajuan", id_pengajuan)
        .execute()
    )

    if not response.data:
        raise InternalError("Gagal menyimpan link Zoom")

    _notify_client_zoom_link(db, id_pengajuan)

    return {
        "message": "Link Zoom berhasil disimpan",
        "data": {"link_zoom": link_zoom.strip()},
    }


def mark_completed(db: Client, current_user: dict, id_pengajuan: int) -> dict:
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang bisa menandai konsultasi selesai")

    user_id = current_user["id_user"]

    cek = (
        db.table("pengajuan_konsultasi")
        .select("id_user, status_pengajuan")
        .eq("id_pengajuan", id_pengajuan)
        .single()
        .execute()
    )

    if not cek.data:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if cek.data["id_user"] != user_id:
        raise ForbiddenError("Akses ditolak: Pengajuan ini bukan milik Anda")

    if cek.data["status_pengajuan"] != "terjadwal":
        raise BadRequestError("Hanya pengajuan dengan status 'terjadwal' yang bisa diselesaikan")

    response = (
        db.table("pengajuan_konsultasi")
        .update({"status_pengajuan": "selesai"})
        .eq("id_pengajuan", id_pengajuan)
        .execute()
    )

    if not response.data:
        raise InternalError("Gagal menandai konsultasi selesai")

    return {"message": "Konsultasi berhasil ditandai selesai!"}


def get_booked_slots(db: Client, id_konsultan: int) -> dict:
    response = (
        db.table("pengajuan_konsultasi")
        .select("jam_mulai, jam_selesai, tanggal_pengajuan")
        .eq("id_konsultan", id_konsultan)
        .eq("status_pengajuan", "terjadwal")
        .execute()
    )

    return {
        "message": "Data jadwal terisi ditemukan",
        "data": response.data
    }


def list_documents(db: Client, current_user: dict, id_pengajuan: int) -> dict:
    pengajuan = db.table("pengajuan_konsultasi").select("id_user, id_konsultan").eq("id_pengajuan", id_pengajuan).execute()
    if not pengajuan.data:
        raise NotFoundError("Pengajuan tidak ditemukan")

    data_pengajuan = pengajuan.data[0]
    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == "client":
        if data_pengajuan["id_user"] != user_id:
            raise ForbiddenError("Akses ditolak")
    elif user_role == "konsultan":
        kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", user_id).single().execute()
        if not kons_profile.data or data_pengajuan["id_konsultan"] != kons_profile.data["id_konsultan"]:
            raise ForbiddenError("Akses ditolak")
    else:
        raise ForbiddenError("Role tidak dikenali")

    docs = (
        db.table("dokumen_pendukung")
        .select("id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at")
        .eq("id_pengajuan", id_pengajuan)
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "message": "Dokumen berhasil dimuat",
        "total": len(docs.data),
        "data": docs.data
    }


async def upload_documents(
    db: Client,
    current_user: dict,
    id_pengajuan: int,
    dokumen_pendukung_files: list[UploadFile],
) -> dict:
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang dapat mengunggah dokumen")

    pengajuan = db.table("pengajuan_konsultasi").select("id_user").eq("id_pengajuan", id_pengajuan).execute()
    if not pengajuan.data:
        raise NotFoundError("Pengajuan tidak ditemukan")
    if pengajuan.data[0]["id_user"] != current_user["id_user"]:
        raise ForbiddenError("Anda tidak berhak mengunggah dokumen untuk pengajuan ini")

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
            result = db.table("dokumen_pendukung").insert({
                "id_pengajuan": id_pengajuan,
                "nama_dokumen": doc_meta["nama_dokumen"],
                "file_url": doc_meta["file_url"],
                "tipe_file": doc_meta["tipe_file"],
                "ukuran_kb": doc_meta["ukuran_kb"],
            }).execute()

            uploaded_docs.append({
                "id_dokumen": result.data[0]["id_dokumen"] if result.data else None,
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
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang dapat menghapus dokumen")

    pengajuan = db.table("pengajuan_konsultasi").select("id_user").eq("id_pengajuan", id_pengajuan).execute()
    if not pengajuan.data:
        raise NotFoundError("Pengajuan tidak ditemukan")
    if pengajuan.data[0]["id_user"] != current_user["id_user"]:
        raise ForbiddenError("Anda tidak berhak menghapus dokumen untuk pengajuan ini")

    doc = db.table("dokumen_pendukung").select("*").eq("id_dokumen", id_dokumen).eq("id_pengajuan", id_pengajuan).execute()
    if not doc.data:
        raise NotFoundError("Dokumen tidak ditemukan")

    doc_data = doc.data[0]
    file_url = doc_data.get("file_url", "")

    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket

    try:
        if f"/storage/v1/object/public/{bucket_name}/" in file_url:
            storage_path = file_url.split(f"/storage/v1/object/public/{bucket_name}/")[1]
            db.storage.from_(bucket_name).remove([storage_path])
    except Exception as e:
        print(f"[WARN] Gagal hapus file dari storage: {e}")

    db.table("dokumen_pendukung").delete().eq("id_dokumen", id_dokumen).execute()

    return {"message": "Dokumen berhasil dihapus", "id_dokumen": id_dokumen}


def submit_rating(
    db: Client, current_user: dict, id_pengajuan: int, rating_data: RatingCreate
) -> dict:
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang dapat memberikan rating")

    user_id = current_user.get("id_user")

    pengajuan_res = db.table("pengajuan_konsultasi").select("id_user, id_konsultan, status_pengajuan").eq("id_pengajuan", id_pengajuan).execute()

    if not pengajuan_res.data:
        raise NotFoundError("Pengajuan tidak ditemukan")

    data_pengajuan = pengajuan_res.data[0]

    if data_pengajuan["id_user"] != user_id:
        raise ForbiddenError("Anda tidak berhak memberi rating pada pengajuan orang lain")

    if data_pengajuan["status_pengajuan"] not in ["terjadwal", "selesai"]:
        raise BadRequestError("Rating hanya dapat diberikan untuk sesi yang sedang berjalan (terjadwal) atau sudah selesai.")

    existing_rating = db.table("rating_ulasan").select("id_rating").eq("id_pengajuan", id_pengajuan).execute()
    if existing_rating.data:
        raise BadRequestError("Anda sudah memberikan ulasan untuk sesi konsultasi ini.")

    rating_insert = {
        "id_pengajuan": id_pengajuan,
        "id_konsultan": data_pengajuan["id_konsultan"],
        "skor_rating": rating_data.skor_rating,
        "ulasan_teks": rating_data.ulasan_teks,
    }

    insert_res = db.table("rating_ulasan").insert(rating_insert).execute()

    if not insert_res.data:
        raise InternalError("Gagal menyimpan ulasan")

    if data_pengajuan["status_pengajuan"] != "selesai":
        db.table("pengajuan_konsultasi").update({"status_pengajuan": "selesai"}).eq("id_pengajuan", id_pengajuan).execute()

    return {"message": "Ulasan berhasil dikirim dan konsultasi telah selesai.", "data": insert_res.data[0]}
