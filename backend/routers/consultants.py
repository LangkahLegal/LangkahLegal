from fastapi import APIRouter, Depends, HTTPException, status, Body
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user

# Tambahkan ScheduleUpdate di baris import
from schemas.consultants import (
    ScheduleCreate,
    ScheduleToggle,
    ConsultantActiveToggle,
    ScheduleUpdate,
)
from typing import List, Optional

router = APIRouter()

# ==========================================
# 1. MODUL KATALOG (PUBLIK / CLIENT)
# ==========================================


@router.get("/", status_code=status.HTTP_200_OK)
def get_all_consultants(
    spesialisasi: Optional[str] = None, 
    db: Client = Depends(get_supabase_client)
):
    try:
        # add join 'users(foto_profil)' ke dalam select
        query = (
            db.table("konsultan")
            .select("""
                id_konsultan,
                nama_lengkap,
                spesialisasi,
                is_active,
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
            # Hitung Rating
            ratings = [r["skor_rating"] for r in item.get("rating_ulasan", []) if r.get("skor_rating")]
            total_reviews = len(ratings)
            rating_avg = round(sum(ratings) / total_reviews, 1) if total_reviews > 0 else 0.0

            # Ambil foto_profil dari join users
            # Skenario: item["users"] akan berupa dict { "foto_profil": "..." }
            user_data = item.get("users") or {}
            
            formatted_item = {
                "id": item["id_konsultan"],
                "name": item["nama_lengkap"],
                "spec": item["spesialisasi"],
                "rating": rating_avg,
                "reviews": total_reviews,
                "status": "online",
                "foto_profil": user_data.get("foto_profil") # Ganti 'avatar' jadi 'foto_profil'
            }
            formatted_data.append(formatted_item)

        return {
            "message": "Katalog konsultan berhasil dimuat",
            "data": formatted_data,
        }
    except Exception as e:
        print(f"Backend Error: {e}")
        return {"data": [], "message": str(e)}


@router.get("/me/schedules")
def get_my_schedules(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    kons = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    # Join ke pengajuan_konsultasi -> users untuk ambil nama klien jika booked
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

@router.get("/me/dashboard-stats", status_code=status.HTTP_200_OK)
def get_consultant_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user["role"] != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya untuk konsultan")

    # 1. Ambil ID Konsultan
    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    id_kons = kons_profile.data["id_konsultan"]

    # 2. Total Income (Nominal Konsultan dari transaksi yang 'settlement')
    # Hak bersih konsultan sudah dihitung di 'nominal_konsultan'
    transaksi = (
        db.table("transaksi")
        .select("nominal_konsultan, pengajuan_konsultasi!inner(id_konsultan)")
        .eq("pengajuan_konsultasi.id_konsultan", id_kons)
        .eq("status_pembayaran", "settlement")
        .execute()
    )
    total_income = sum([t["nominal_konsultan"] for t in transaksi.data])

    # 3. Total Klien (Status 'terjadwal' + 'selesai')
    total_klien = (
        db.table("pengajuan_konsultasi")
        .select("id_user", count="exact")
        .eq("id_konsultan", id_kons)
        .in_("status_pengajuan", ["terjadwal", "selesai"])
        .execute()
    )

    # 4. Total Klien Aktif (Status 'terjadwal')
    klien_aktif = (
        db.table("pengajuan_konsultasi")
        .select("id_user", count="exact")
        .eq("id_konsultan", id_kons)
        .eq("status_pengajuan", "terjadwal")
        .execute()
    )

    return {
        "total_income": total_income,
        "total_klien": total_klien.count,
        "total_klien_aktif": klien_aktif.count,
    }


@router.get("/me/requests/pending")
def get_pending_requests(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya untuk konsultan")

    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    if not kons_profile.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    response = (
        db.table("pengajuan_konsultasi")
        .select(
            """
            id_pengajuan, deskripsi_kasus, status_pengajuan, created_at,
            users ( nama, foto_profil ),
            jadwal_ketersediaan ( tanggal, jam_mulai, jam_selesai )
        """
        )
        .eq("id_konsultan", kons_profile.data["id_konsultan"])
        .eq("status_pengajuan", "pending")
        .execute()
    )
    return response.data


@router.get("/me/requests/active")
def get_active_requests(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya untuk konsultan")

    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    if not kons_profile.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    response = (
        db.table("pengajuan_konsultasi")
        .select(
            """
            id_pengajuan, deskripsi_kasus, status_pengajuan, created_at,
            users ( nama, foto_profil ),
            jadwal_ketersediaan ( tanggal, jam_mulai, jam_selesai )
        """
        )
        .eq("id_konsultan", kons_profile.data["id_konsultan"])
        .eq("status_pengajuan", "terjadwal")
        .execute()
    )
    return response.data


# --- BAGIAN ODE: JADWAL (SCHEDULE PAGE) ---


@router.get("/{id_konsultan}", status_code=status.HTTP_200_OK)
def get_consultant_detail(id_konsultan: int, db: Client = Depends(get_supabase_client)):
    """
    Mengambil profil detail satu konsultan berdasarkan ID.
    """
    # Pastikan .eq() membandingkan dengan kolom 'id_konsultan' (bukan 'id')
    response = (
        db.table("konsultan")
        .select("*, users(nama, email)")
        .eq("id_konsultan", id_konsultan)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Konsultan tidak ditemukan")

    return {"message": "Detail profil ditemukan", "data": response.data[0]}


@router.get("/{id_konsultan}/schedules", status_code=status.HTTP_200_OK)
def get_consultant_schedules(
    id_konsultan: int, db: Client = Depends(get_supabase_client)
):
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
        raise HTTPException(status_code=500, detail=f"Gagal mengambil jadwal: {str(e)}")


@router.post("/schedules", status_code=status.HTTP_201_CREATED)
def upload_jadwal_konsultan(
    request: ScheduleCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    (Khusus Konsultan) Menambahkan slot jadwal ketersediaan.
    """
    # 1. Validasi Role
    if current_user.get("role") != "konsultan":
        raise HTTPException(
            status_code=403, detail="Hanya konsultan yang bisa mengatur jadwal"
        )

    # 2. Cari ID Konsultan asli (karena di token biasanya cuma ada id_user)
    konsultan = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .execute()
    )

    if not konsultan.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    # 3. Insert ke Tabel Jadwal
    new_schedule = {
        "id_konsultan": konsultan.data[0]["id_konsultan"],
        "tanggal": request.tanggal,
        "jam_mulai": request.jam_mulai,
        "jam_selesai": request.jam_selesai,
        "status_tersedia": True,
    }

    response = db.table("jadwal_ketersediaan").insert(new_schedule).execute()

    return {"message": "Jadwal berhasil ditambahkan", "data": response.data[0]}


# ==========================================
# 3. MODUL MANAJEMEN JADWAL (EDIT & DELETE)
# ==========================================


@router.delete("/schedules/{id_jadwal}", status_code=status.HTTP_200_OK)
def hapus_jadwal_konsultan(
    id_jadwal: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    (Khusus Konsultan) Menghapus slot jadwal yang belum dipesan.
    """
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Akses ditolak")

    # Pastikan jadwal belum dibooking (status_tersedia = True)
    jadwal = (
        db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()
    )
    if not jadwal.data:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    if not jadwal.data[0]["status_tersedia"]:
        raise HTTPException(
            status_code=400,
            detail="Jadwal tidak bisa dihapus karena sudah dipesan klien",
        )

    db.table("jadwal_ketersediaan").delete().eq("id_jadwal", id_jadwal).execute()
    return {"message": "Jadwal berhasil dihapus"}


@router.put("/schedules/{id_jadwal}", status_code=status.HTTP_200_OK)
def edit_jadwal_konsultan(
    id_jadwal: int,
    request: ScheduleUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    (Khusus Konsultan) Mengubah jam/tanggal jadwal yang belum dipesan.
    """
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Akses ditolak")

    jadwal = (
        db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()
    )
    if not jadwal.data or not jadwal.data[0]["status_tersedia"]:
        raise HTTPException(
            status_code=400, detail="Jadwal tidak ditemukan atau sudah dipesan"
        )

    update_data = {k: v for k, v in request.dict().items() if v is not None}

    response = (
        db.table("jadwal_ketersediaan")
        .update(update_data)
        .eq("id_jadwal", id_jadwal)
        .execute()
    )
    return {"message": "Jadwal berhasil diperbarui", "data": response.data[0]}





@router.patch("/schedules/{id_jadwal}/toggle")
def toggle_schedule_slot(
    id_jadwal: int, payload: ScheduleToggle, db: Client = Depends(get_supabase_client)
):
    # Update status per slot
    return (
        db.table("jadwal_ketersediaan")
        .update({"status_tersedia": payload.status_tersedia})
        .eq("id_jadwal", id_jadwal)
        .execute()
    )


@router.patch("/me/active-status")
def toggle_global_active(
    payload: ConsultantActiveToggle,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # Update ketersediaan global (is_active)
    return (
        db.table("konsultan")
        .update({"is_active": payload.is_active})
        .eq("id_user", current_user["id_user"])
        .execute()
    )
