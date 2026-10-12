from datetime import datetime, timedelta, timezone
from typing import Optional

from supabase import Client

from exceptions import BadRequestError, ForbiddenError, InternalError, NotFoundError
from schemas.consultants import (
    ConsultantActiveToggle,
    ScheduleCreate,
    ScheduleToggle,
    ScheduleUpdate,
)


def list_active_consultants(db: Client, spesialisasi: Optional[str] = None) -> dict:
    try:
        query = (
            db.table("konsultan")
            .select("""
                id_konsultan,
                nama_lengkap,
                spesialisasi,
                is_active,
                status_verifikasi,
                tarif_per_sesi,
                users (foto_profil),
                rating_ulasan (skor_rating)
            """)
            .eq("is_active", True)
        )

        if spesialisasi and spesialisasi != "semua":
            query = query.ilike("spesialisasi", f"%{spesialisasi}%")

        response = query.execute()

        formatted_data = []
        for item in response.data:
            ratings = [r["skor_rating"] for r in item.get("rating_ulasan", []) if r.get("skor_rating")]
            total_reviews = len(ratings)
            rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

            user_data = item.get("users") or {}

            formatted_item = {
                "id": item["id_konsultan"],
                "name": item["nama_lengkap"],
                "spec": item["spesialisasi"],
                "rating": rating_avg,
                "reviews": total_reviews,
                "status": "online",
                "foto_profil": user_data.get("foto_profil"),
                "status_verifikasi": item.get("status_verifikasi"),
                "tarif_per_sesi": item.get("tarif_per_sesi")
            }
            formatted_data.append(formatted_item)

        return {
            "message": "Katalog konsultan berhasil dimuat",
            "data": formatted_data,
        }
    except Exception as e:
        print(f"Backend Error: {e}")
        return {"data": [], "message": str(e)}


def get_consultant_detail(db: Client, id_konsultan: int) -> dict:
    """
    Mengambil profil detail satu konsultan beserta jadwal ketersediaannya
    (sebagai jam buka/tutup).
    """
    response = (
        db.table("konsultan")
        .select("*, users(nama, email, foto_profil), rating_ulasan(skor_rating)")
        .eq("id_konsultan", id_konsultan)
        .execute()
    )

    if not response.data:
        raise NotFoundError("Konsultan tidak ditemukan")

    konsultan_data = response.data[0]

    ratings = [r["skor_rating"] for r in konsultan_data.get("rating_ulasan", []) if r.get("skor_rating")]
    total_reviews = len(ratings)
    rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

    konsultan_data.pop("rating_ulasan", None)
    konsultan_data["rating"] = rating_avg
    konsultan_data["reviews"] = total_reviews

    jadwal_response = (
        db.table("jadwal_ketersediaan")
        .select("id_jadwal, tanggal, jam_mulai, jam_selesai, status_tersedia")
        .eq("id_konsultan", id_konsultan)
        .eq("status_tersedia", True)
        .order("tanggal")
        .execute()
    )

    konsultan_data["jadwal_ketersediaan"] = jadwal_response.data

    return {"message": "Detail profil ditemukan", "data": konsultan_data}


def get_available_schedules(db: Client, id_konsultan: int) -> dict:
    """
    Melihat jadwal ketersediaan konsultan untuk diajukan oleh Klien.
    Penting: Hanya jadwal dengan status_tersedia = True yang muncul.
    """
    try:
        response = (
            db.table("jadwal_ketersediaan")
            .select("*")
            .eq("id_konsultan", id_konsultan)
            .eq("status_tersedia", True)
            .execute()
        )

        return {
            "status": "success",
            "id_konsultan": id_konsultan,
            "data": response.data,
        }
    except Exception as e:
        raise InternalError(f"Gagal mengambil jadwal: {str(e)}")


def get_my_schedules(db: Client, current_user: dict) -> list:
    kons = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    query = (
        db.table("jadwal_ketersediaan")
        .select(
            """
        id_jadwal, tanggal, jam_mulai, jam_selesai, status_tersedia,
        pengajuan_konsultasi ( users ( nama ) )
    """
        )
        .eq("id_konsultan", kons.data["id_konsultan"])
        .execute()
    )

    formatted = []
    for item in query.data:
        pengajuan = item.get("pengajuan_konsultasi", [])
        nama_klien = (
            pengajuan[0]["users"]["nama"]
            if pengajuan and pengajuan[0].get("users")
            else None
        )
        formatted.append({**item, "nama_klien": nama_klien})
    return formatted


def get_dashboard_stats(db: Client, current_user: dict) -> dict:
    if current_user["role"] != "konsultan":
        raise ForbiddenError("Hanya untuk konsultan")

    kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", current_user["id_user"]).limit(1).execute()
    if not kons_profile.data:
        raise NotFoundError("Profil konsultan tidak ditemukan")
    id_kons = kons_profile.data[0]["id_konsultan"]

    pengajuan_with_tx = (
        db.table("pengajuan_konsultasi")
        .select("transaksi(nominal_konsultan, status_pembayaran)")
        .eq("id_konsultan", id_kons)
        .execute()
    )

    total_income = 0
    for p in pengajuan_with_tx.data:
        tx_list = p.get("transaksi") or []
        if isinstance(tx_list, dict): tx_list = [tx_list]
        for tx in tx_list:
            if tx.get("status_pembayaran") == "settlement":
                total_income += float(tx.get("nominal_konsultan") or 0)

    klien_data_res = (
        db.table("pengajuan_konsultasi")
        .select("id_user, status_pengajuan")
        .eq("id_konsultan", id_kons)
        .in_("status_pengajuan", ["terjadwal", "selesai"])
        .execute()
    )

    all_data = klien_data_res.data or []

    unique_klien = set(p["id_user"] for p in all_data)

    sesi_aktif = [p for p in all_data if p["status_pengajuan"] == "terjadwal"]

    return {
        "total_income": total_income,
        "total_klien": len(unique_klien),
        "total_klien_aktif": len(sesi_aktif),
    }


def get_pending_requests(db: Client, current_user: dict) -> list:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya untuk konsultan")

    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )

    if not kons_profile.data:
        raise NotFoundError("Profil konsultan tidak ditemukan")

    response = (
        db.table("pengajuan_konsultasi")
        .select(
            """
            id_pengajuan,
            deskripsi_kasus,
            status_pengajuan,
            created_at,
            tanggal_pengajuan,
            jam_mulai,
            jam_selesai,
            id_bursa,
            users (
                nama,
                foto_profil
            )
        """
        )
        .eq("id_konsultan", kons_profile.data["id_konsultan"])
        .eq("status_pengajuan", "pending")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def get_active_requests(db: Client, current_user: dict) -> list:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya untuk konsultan")

    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )

    if not kons_profile.data:
        raise NotFoundError("Profil konsultan tidak ditemukan")

    response = (
        db.table("pengajuan_konsultasi")
        .select(
            """
            id_pengajuan,
            deskripsi_kasus,
            status_pengajuan,
            created_at,
            tanggal_pengajuan,
            jam_mulai,
            jam_selesai,
            id_bursa,
            users ( nama, foto_profil )
        """
        )
        .eq("id_konsultan", kons_profile.data["id_konsultan"])
        .in_("status_pengajuan", ["terjadwal", "menunggu_pembayaran"])
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def get_scheduled_clients(db: Client, current_user: dict) -> dict:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Akses ditolak")

    kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", current_user["id_user"]).single().execute()
    if not kons_profile.data:
        raise NotFoundError("Profil tidak ditemukan")

    id_kons = kons_profile.data["id_konsultan"]

    response = (
        db.table("pengajuan_konsultasi")
        .select("*, users(nama, foto_profil), jadwal_ketersediaan(tanggal)")
        .eq("id_konsultan", id_kons)
        .eq("status_pengajuan", "terjadwal")
        .execute()
    )

    wib = timezone(timedelta(hours=7))
    now = datetime.now(wib).replace(tzinfo=None)

    formatted_data = []

    for req in response.data:
        jadwal = req.get("jadwal_ketersediaan") or {}
        if isinstance(jadwal, list):
            jadwal = jadwal[0] if len(jadwal) > 0 else {}

        tanggal_konsultasi = req.get("tanggal_pengajuan") or jadwal.get("tanggal")
        jam_selesai_str = str(req.get("jam_selesai", ""))[:5]

        if not tanggal_konsultasi:
            continue

        try:
            jam_selesai_full = jam_selesai_str if jam_selesai_str else "23:59"
            deadline = datetime.strptime(f"{tanggal_konsultasi} {jam_selesai_full}", "%Y-%m-%d %H:%M")
        except ValueError:
            deadline = datetime.strptime(tanggal_konsultasi, "%Y-%m-%d").replace(hour=23, minute=59)

        if now <= deadline:
            formatted_data.append({
                "id_pengajuan": req["id_pengajuan"],
                "nama_klien": req.get("users", {}).get("nama"),
                "foto_profil": req.get("users", {}).get("foto_profil"),
                "tanggal_konsultasi": tanggal_konsultasi,
                "waktu_mulai": str(req.get("jam_mulai", ""))[:5],
                "waktu_selesai": jam_selesai_str,
                "tanggal_pengajuan": req.get("tanggal_pengajuan") or req.get("created_at")
            })

    return {
        "total_klien_aktif": len(formatted_data),
        "data": formatted_data
    }


def get_history(db: Client, current_user: dict) -> dict:
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Akses ditolak")

    kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", current_user["id_user"]).limit(1).execute()
    if not kons_profile.data:
        raise NotFoundError("Profil tidak ditemukan")

    id_kons = kons_profile.data[0]["id_konsultan"]

    response = (
        db.table("pengajuan_konsultasi")
        .select("*, users(nama, foto_profil), jadwal_ketersediaan(tanggal), transaksi(nominal_konsultan)")
        .eq("id_konsultan", id_kons)
        .neq("status_pengajuan", "pending")
        .execute()
    )

    formatted_data = []

    for req in response.data:
        jadwal = req.get("jadwal_ketersediaan") or {}
        trans = req.get("transaksi") or []

        nominal = 0
        if isinstance(trans, list) and len(trans) > 0:
            nominal = trans[0].get("nominal_konsultan") or 0
        elif isinstance(trans, dict):
             nominal = trans.get("nominal_konsultan") or 0

        status_akhir = req.get("status_pengajuan")
        if status_akhir in ["cancelled", "dibatalkan", "ditolak", "kedaluwarsa"]:
            nominal = 0

        jm = str(req.get("jam_mulai", ""))[:5]
        js = str(req.get("jam_selesai", ""))[:5]

        formatted_data.append({
            "id_pengajuan": req["id_pengajuan"],
            "id_bursa": req.get("id_bursa"),
            "nama_klien": req.get("users", {}).get("nama"),
            "foto_profil": req.get("users", {}).get("foto_profil"),
            "rentang_waktu": f"{jm} - {js}" if jm and js else "",
            "status": status_akhir,
            "tanggal_konsultasi": jadwal.get("tanggal") or req.get("tanggal_pengajuan", ""),
            "jam_mulai": jm,
            "jam_selesai": js,
            "nominal_konsultan": nominal
        })

    formatted_data.sort(key=lambda x: x["tanggal_konsultasi"], reverse=True)

    total_selesai = sum(1 for item in formatted_data if item["status"] == "selesai")

    return {
        "total_sesi_selesai": total_selesai,
        "data": formatted_data
    }


def create_schedule(db: Client, current_user: dict, request: ScheduleCreate) -> dict:
    """
    (Khusus Konsultan) Menambahkan slot jadwal ketersediaan.
    """
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Hanya konsultan yang bisa mengatur jadwal")

    konsultan = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .execute()
    )

    if not konsultan.data:
        raise NotFoundError("Profil konsultan tidak ditemukan")

    new_schedule = {
        "id_konsultan": konsultan.data[0]["id_konsultan"],
        "tanggal": request.tanggal,
        "jam_mulai": request.jam_mulai,
        "jam_selesai": request.jam_selesai,
        "status_tersedia": True,
    }

    response = db.table("jadwal_ketersediaan").insert(new_schedule).execute()

    return {"message": "Jadwal berhasil ditambahkan", "data": response.data[0]}


def delete_schedule(db: Client, current_user: dict, id_jadwal: int) -> dict:
    """
    (Khusus Konsultan) Menghapus slot jadwal yang belum dipesan.
    """
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Akses ditolak")

    jadwal = (
        db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()
    )
    if not jadwal.data:
        raise NotFoundError("Jadwal tidak ditemukan")

    if not jadwal.data[0]["status_tersedia"]:
        raise BadRequestError("Jadwal tidak bisa dihapus karena sudah dipesan klien")

    db.table("jadwal_ketersediaan").delete().eq("id_jadwal", id_jadwal).execute()
    return {"message": "Jadwal berhasil dihapus"}


def update_schedule(
    db: Client, current_user: dict, id_jadwal: int, request: ScheduleUpdate
) -> dict:
    """
    (Khusus Konsultan) Mengubah jam/tanggal jadwal yang belum dipesan.
    """
    if current_user.get("role") != "konsultan":
        raise ForbiddenError("Akses ditolak")

    jadwal = (
        db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()
    )
    if not jadwal.data or not jadwal.data[0]["status_tersedia"]:
        raise BadRequestError("Jadwal tidak ditemukan atau sudah dipesan")

    update_data = {k: v for k, v in request.dict().items() if v is not None}

    response = (
        db.table("jadwal_ketersediaan")
        .update(update_data)
        .eq("id_jadwal", id_jadwal)
        .execute()
    )
    return {"message": "Jadwal berhasil diperbarui", "data": response.data[0]}


def toggle_schedule_slot(db: Client, id_jadwal: int, payload: ScheduleToggle):
    return (
        db.table("jadwal_ketersediaan")
        .update({"status_tersedia": payload.status_tersedia})
        .eq("id_jadwal", id_jadwal)
        .execute()
    )


def toggle_global_active(db: Client, current_user: dict, payload: ConsultantActiveToggle):
    return (
        db.table("konsultan")
        .update({"is_active": payload.is_active})
        .eq("id_user", current_user["id_user"])
        .execute()
    )
