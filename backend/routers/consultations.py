from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from supabase import Client
from database import get_supabase_client
from schemas.consultations import ConsultationCreate, ConsultationRespond, RatingCreate, AssignSchedule
from dependencies import get_current_user
from config import get_settings
from services import upload_supporting_document_to_supabase

router = APIRouter()
    
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Buat pengajuan konsultasi + upload dokumen pendukung",
    description="""
Membuat pengajuan konsultasi baru (khusus role client).

Mendukung 2 format request:
1. `application/json` untuk pengajuan tanpa file.
2. `multipart/form-data` untuk pengajuan dengan file dokumen pendukung.

Field wajib:
- `id_jadwal`: ID slot jadwal yang dipilih client.
- `deskripsi_kasus`: Ringkasan masalah hukum.
- `jam_mulai`: ISO 8601 timestamp, contoh `2026-04-13T09:00:00+07:00`.
- `jam_selesai`: ISO 8601 timestamp, harus lebih besar dari jam_mulai.

Upload dokumen:
- Gunakan field file `dokumen_pendukung_files` (bisa lebih dari satu file).
- Format yang diizinkan: PDF / JPG / JPEG / PNG / WEBP / GIF.
- File disimpan ke Supabase bucket `berkas-pendukung`, metadata tersimpan di tabel `dokumen_pendukung`.
""",
    response_description="ID pengajuan, status pengajuan, dan list metadata dokumen pendukung yang berhasil disimpan.",
)
async def buat_pengajuan_konsultasi(
    id_jadwal: int = Form(...), 
    deskripsi_kasus: str = Form(...),
    jam_mulai: str = Form(...),
    jam_selesai: str = Form(...),
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    # Security check: Hanya client yang boleh submit
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang dapat membuat pengajuan")

    # Validasi jumlah file (maks 10)
    if dokumen_pendukung_files:
        valid_files = [f for f in dokumen_pendukung_files if f.filename]
        if len(valid_files) > 10:
            raise HTTPException(status_code=400, detail="Maksimal 10 file dokumen pendukung")
    else:
        valid_files = []

    # 1. Ambil data jadwal ketersediaan untuk validasi range jam dan ambil tanggal
    jadwal = db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()
    
    if not jadwal.data:
        raise HTTPException(status_code=404, detail="Jadwal ketersediaan tidak ditemukan")
    
    data_jadwal = jadwal.data[0]
    
    # 2. Validasi Jam
    if jam_mulai < data_jadwal["jam_mulai"] or jam_selesai > data_jadwal["jam_selesai"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})"
        )

    # 3. Buat record pengajuan
    new_pengajuan = {
        "id_user": current_user["id_user"],
        "id_konsultan": data_jadwal["id_konsultan"],
        "id_jadwal": id_jadwal,
        "tanggal_pengajuan": data_jadwal["tanggal"],  ### TAMBAHKAN INI: Mengambil tanggal dari jadwal
        "jam_mulai": jam_mulai, 
        "jam_selesai": jam_selesai, 
        "deskripsi_kasus": deskripsi_kasus,
        "status_pengajuan": "pending"
    }
    
    res_pengajuan = db.table("pengajuan_konsultasi").insert(new_pengajuan).execute()
    
    if not res_pengajuan.data:
        raise HTTPException(status_code=500, detail="Gagal menyimpan data pengajuan")

    id_pengajuan = res_pengajuan.data[0]["id_pengajuan"]

    # 4. Upload dokumen pendukung ke Supabase bucket (jika ada)
    # ... (sisanya tetap sama) ...
    
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

    return {
        "message": "Pengajuan berhasil dikirim.",
        "data": {
            "id_pengajuan": id_pengajuan,
            "tanggal_konsultasi": data_jadwal["tanggal"], ### TAMBAHKAN INI ke response agar jelas
            "jam_diajukan": f"{jam_mulai} - {jam_selesai}",
            "status": "pending",
            "dokumen_terupload": uploaded_docs,
            "dokumen_gagal": failed_docs,
        }
    }

@router.put("/{id_pengajuan}/status")
def update_consultation_status(
    id_pengajuan: int,
    new_status: str, # 'pending', 'menunggu_pembayaran', 'terjadwal', 'selesai', 'dibatalkan', 'ditolak'
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    # 1. Ambil data pengajuan dulu untuk pengecekan kepemilikan/hak akses
    pengajuan_res = db.table("pengajuan_konsultasi").select("*").eq("id_pengajuan", id_pengajuan).execute()
    
    if not pengajuan_res.data:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan")
    
    data_pengajuan = pengajuan_res.data[0]
    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    # 2. Validasi Hak Akses Berdasarkan Role
    if user_role == "client":
        # Client HANYA boleh membatalkan
        if new_status != "dibatalkan":
            raise HTTPException(status_code=403, detail="Klien hanya diizinkan untuk membatalkan pengajuan")
        # Client HANYA boleh membatalkan miliknya sendiri
        if data_pengajuan["id_user"] != user_id:
            raise HTTPException(status_code=403, detail="Anda tidak diizinkan mengubah pengajuan orang lain")

    elif user_role == "konsultan":
        kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", user_id).single().execute()
        if not kons_profile.data or data_pengajuan["id_konsultan"] != kons_profile.data["id_konsultan"]:
             raise HTTPException(status_code=403, detail="Akses ditolak: Pengajuan ini bukan milik Anda")
    
    else:
        raise HTTPException(status_code=403, detail="Role tidak dikenali")

    if new_status.lower() in ["ditolak", "dibatalkan"]:
        if data_pengajuan.get("id_jadwal"):
            db.table("jadwal_ketersediaan")\
                .update({"status_tersedia": True})\
                .eq("id_jadwal", data_pengajuan["id_jadwal"])\
                .execute()

    # 4. Update status_pengajuan
    response = db.table("pengajuan_konsultasi")\
        .update({"status_pengajuan": new_status})\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Gagal memperbarui status")

    return {"message": f"Status berhasil diubah menjadi {new_status}"}
    
@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Ambil daftar konsultasi milik user login",
    description="""
Mengembalikan daftar pengajuan konsultasi berdasarkan role user:
- Client: hanya pengajuan milik dirinya.
- Konsultan: hanya pengajuan yang ditujukan ke dirinya.

Response sudah termasuk relasi:
- jadwal_ketersediaan
- profil singkat konsultan
- dokumen_pendukung (one-to-many)
""",
)
def get_my_consultations(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    Mengambil list konsultasi dengan JOIN ke jadwal dan nama konsultan.
    """
    # REVISI: Menambahkan foto_profil di dalam select konsultan
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

    # Filter berdasarkan siapa yang panggil
    if current_user["role"] == "client":
        query = query.eq("id_user", current_user["id_user"])
    elif current_user["role"] == "konsultan":
        # Ambil id_konsultan milik user yang login
        kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", current_user["id_user"]).single().execute()
        if kons_profile.data:
            query = query.eq("id_konsultan", kons_profile.data["id_konsultan"])

    response = query.execute()
    return {"data": response.data}
    
@router.get(
    "/{id_pengajuan}",
    status_code=status.HTTP_200_OK,
    summary="Ambil detail satu pengajuan konsultasi",
    description="""
Mengambil detail lengkap pengajuan konsultasi berdasarkan `id_pengajuan`.

Akses dibatasi:
- Client hanya boleh melihat pengajuan miliknya.
- Konsultan hanya boleh melihat pengajuan yang terkait dengan profil konsultannya.

Response mencakup data relasi jadwal, user, dan daftar dokumen_pendukung.
""",
)
def get_detail_pengajuan(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    # Bangun query dasar dengan filter id_pengajuan
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

    # Batasi akses berdasarkan peran pengguna
    if current_user.get("role") == "client":
        # Hanya pemilik pengajuan (klien) yang boleh melihat
        query = query.eq("id_user", current_user["id_user"])
    elif current_user.get("role") == "konsultan":
        # Ambil id_konsultan milik user yang login
        kons_profile = db.table("konsultan").select("id_konsultan")\
            .eq("id_user", current_user["id_user"]).single().execute()
        if not kons_profile.data:
            raise HTTPException(status_code=403, detail="Akses ditolak")
        query = query.eq("id_konsultan", kons_profile.data["id_konsultan"])
    else:
        # Role lain tidak diizinkan mengakses detail pengajuan
        raise HTTPException(status_code=403, detail="Akses ditolak")

    response = query.execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Detail tidak ditemukan")

    data = response.data[0]
    
    # Ekstraksi field agar sesuai dengan kebutuhan response UI Permintaan Baru
    jadwal = data.get("jadwal_ketersediaan") or {}
    konsultan_via_jadwal = jadwal.get("konsultan") or {}
    konsultan_direct = data.get("konsultan") or {}
    user_info = data.get("users") or {}
    docs = data.get("dokumen_pendukung") or []
    
    data["nama_klien"] = user_info.get("nama")
    data["foto_profil"] = user_info.get("foto_profil")
    data["tanggal_pengajuan"] = data.get("tanggal_pengajuan") or data.get("created_at")
    # Tanggal konsultasi: dari jadwal ketersediaan ATAU langsung dari tanggal_pengajuan (bursa)
    data["tanggal_konsultasi"] = jadwal.get("tanggal") or str(data.get("tanggal_pengajuan", ""))[:10]
    
    # Format rentang waktu HH:MM - HH:MM jika ada detiknya kita hilangkan biar lebih rapi atau biarkan saja
    jm = str(data.get("jam_mulai", ""))[:5]
    js = str(data.get("jam_selesai", ""))[:5]
    data["rentang_waktu"] = f"{jm} - {js}" if jm and js else ""
    
    import math
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

    data["jumlah_sesi"] = jumlah_sesi
    
    # Ambil tarif: dari jadwal konsultan ATAU direct konsultan join (bursa)
    tarif_skrg = konsultan_via_jadwal.get("tarif_per_sesi") or konsultan_direct.get("tarif_per_sesi", 0)
    data["total_harga"] = tarif_skrg * jumlah_sesi

    # link_dokumen: prioritaskan kolom langsung (dari GDrive URL), fallback ke file upload pertama
    data["link_dokumen"] = data.get("link_dokumen") or (docs[0].get("file_url") if len(docs) > 0 else None)

    # Link Zoom untuk konsultasi terjadwal
    data["link_zoom"] = data.get("link_zoom")

    # Expose array berkas_pendukung lengkap dari tabel dokumen_pendukung (upload ke Supabase bucket)
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

    # Fallback: Untuk bursa kasus, dokumen tersimpan di field dokumen_bukti (comma-separated URLs)
    if not berkas and data.get("id_bursa"):
        try:
            bursa_data = db.table("bursa_kasus").select("dokumen_bukti").eq("id_bursa", data["id_bursa"]).execute()
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

    data["berkas_pendukung"] = berkas

    return {"data": data}


@router.put(
    "/{id_pengajuan}/assign-schedule",
    summary="Konsultan atur jadwal untuk klaim bursa",
    description="""
Khusus konsultan. Digunakan setelah konsultan mengklaim kasus dari bursa.
Konsultan memilih slot jadwal miliknya, lalu sistem:
- Mengisi tanggal_pengajuan, jam_mulai, jam_selesai, id_jadwal pada pengajuan.
- Mengubah status menjadi `menunggu_pembayaran`.
""",
)
def assign_schedule_to_claim(
    id_pengajuan: int,
    request: AssignSchedule,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # 0. Hanya konsultan
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa mengatur jadwal")

    # 1. Ambil id_konsultan
    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    if not kons_profile.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    real_id_konsultan = kons_profile.data["id_konsultan"]

    # 2. Ambil data pengajuan & validasi
    pengajuan = (
        db.table("pengajuan_konsultasi")
        .select("id_pengajuan, id_konsultan, status_pengajuan, id_bursa")
        .eq("id_pengajuan", id_pengajuan)
        .execute()
    )
    if not pengajuan.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    data_pengajuan = pengajuan.data[0]

    if data_pengajuan["id_konsultan"] != real_id_konsultan:
        raise HTTPException(status_code=403, detail="Pengajuan ini bukan milik Anda")

    if data_pengajuan["status_pengajuan"] != "pending":
        raise HTTPException(status_code=400, detail="Hanya pengajuan berstatus pending yang bisa dijadwalkan")

    # 3. Validasi jadwal milik konsultan ini
    jadwal = (
        db.table("jadwal_ketersediaan")
        .select("id_jadwal, id_konsultan, tanggal, jam_mulai, jam_selesai, status_tersedia")
        .eq("id_jadwal", request.id_jadwal)
        .execute()
    )
    if not jadwal.data:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    data_jadwal = jadwal.data[0]

    if data_jadwal["id_konsultan"] != real_id_konsultan:
        raise HTTPException(status_code=403, detail="Jadwal ini bukan milik Anda")

    if not data_jadwal["status_tersedia"]:
        raise HTTPException(status_code=400, detail="Slot jadwal sudah tidak tersedia")

    # Validasi jam dalam rentang jadwal
    if request.jam_mulai < data_jadwal["jam_mulai"] or request.jam_selesai > data_jadwal["jam_selesai"]:
        raise HTTPException(
            status_code=400,
            detail=f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})",
        )

    # 4. Update pengajuan dengan data jadwal + status
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
        raise HTTPException(status_code=500, detail="Gagal mengatur jadwal")

    # 5. Tandai slot jadwal sebagai tidak tersedia
    db.table("jadwal_ketersediaan").update({"status_tersedia": False}).eq(
        "id_jadwal", request.id_jadwal
    ).execute()

    return {
        "message": "Jadwal berhasil diatur. Status berubah ke menunggu_pembayaran.",
        "data": response.data[0],
    }


@router.put(
    "/{id_pengajuan}/zoom-link",
    summary="Konsultan mengatur link Zoom untuk konsultasi",
    description="""
Khusus konsultan. Digunakan untuk mengisi atau mengubah link Zoom meeting
untuk sesi konsultasi yang sudah terjadwal.
""",
)
def update_zoom_link(
    id_pengajuan: int,
    link_zoom: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa mengatur link Zoom")

    # Ambil id_konsultan
    kons_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )
    if not kons_profile.data:
        raise HTTPException(status_code=404, detail="Profil konsultan tidak ditemukan")

    # Validasi pengajuan milik konsultan ini
    pengajuan = (
        db.table("pengajuan_konsultasi")
        .select("id_pengajuan, id_konsultan, status_pengajuan")
        .eq("id_pengajuan", id_pengajuan)
        .eq("id_konsultan", kons_profile.data["id_konsultan"])
        .execute()
    )

    if not pengajuan.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan atau bukan milik Anda")

    # Tetap batasi status agar tidak merusak flow lain
    if pengajuan.data[0]["status_pengajuan"] not in ["terjadwal", "menunggu_pembayaran", "selesai"]:
        raise HTTPException(status_code=400, detail="Link Zoom hanya bisa diatur untuk sesi yang relevan")

    response = (
        db.table("pengajuan_konsultasi")
        .update({"link_zoom": link_zoom.strip()})
        .eq("id_pengajuan", id_pengajuan)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Gagal menyimpan link Zoom")

    return {
        "message": "Link Zoom berhasil disimpan",
        "data": {"link_zoom": link_zoom.strip()},
    }


@router.post(
    "/{id_pengajuan}/rating",
    summary="Client memberi rating setelah konsultasi selesai",
    description="""
Khusus role client.
Rating hanya dapat diberikan jika status pengajuan adalah `completed`.
""",
)
def beri_rating_konsultasi(
    id_pengajuan: int,
    request: RatingCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang bisa memberi rating")

    # Pastikan konsultasi sudah selesai dan milik current_user
    cek = (
        db.table("pengajuan_konsultasi")
        .select("status_pengajuan")
        .eq("id_pengajuan", id_pengajuan)
        .eq("id_user", current_user["id_user"])
        .single()
        .execute()
    )

    if not cek.data:
        # Pengajuan tidak ditemukan atau tidak dimiliki oleh user saat ini
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    if cek.data["status_pengajuan"] != "completed":
        raise HTTPException(status_code=400, detail="Rating hanya bisa diberikan setelah konsultasi selesai")

    response = (
        db.table("pengajuan_konsultasi")
        .update({"rating": request.skor, "ulasan": request.ulasan})
        .eq("id_pengajuan", id_pengajuan)
        .eq("id_user", current_user["id_user"])
        .execute()
    )

    if not response.data:
        # Tidak ada baris yang terupdate (mis. bukan milik user ini)
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    return {"message": "Terima kasih atas penilaian Anda!"}



@router.get("/{id_konsultan}/booked-slots", status_code=status.HTTP_200_OK)
def get_booked_slots(
    id_konsultan: int, 
    db: Client = Depends(get_supabase_client)
):
    """
    Mengambil daftar jam yang sudah terisi (booked) untuk konsultan tertentu.
    Digunakan oleh frontend untuk menonaktifkan pilihan jam di Schedule Picker.
    """
    # Ambil jam mulai, jam selesai, dan tanggal langsung dari satu tabel
    # Filter status_pengajuan = 'terjadwal' agar hanya yang fix saja yang memblokir
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


# ==========================================
# CRUD DOKUMEN PENDUKUNG (Post-Pengajuan)
# ==========================================

@router.get(
    "/{id_pengajuan}/documents",
    status_code=status.HTTP_200_OK,
    summary="Lihat daftar dokumen pendukung",
    description="""
Mengambil semua dokumen pendukung yang terkait dengan pengajuan konsultasi tertentu.
Akses dibatasi: hanya pemilik pengajuan (client) atau konsultan terkait yang bisa melihat.
""",
)
def get_documents(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # 1. Cek kepemilikan pengajuan
    pengajuan = db.table("pengajuan_konsultasi").select("id_user, id_konsultan").eq("id_pengajuan", id_pengajuan).execute()
    if not pengajuan.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    data_pengajuan = pengajuan.data[0]
    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == "client":
        if data_pengajuan["id_user"] != user_id:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    elif user_role == "konsultan":
        kons_profile = db.table("konsultan").select("id_konsultan").eq("id_user", user_id).single().execute()
        if not kons_profile.data or data_pengajuan["id_konsultan"] != kons_profile.data["id_konsultan"]:
            raise HTTPException(status_code=403, detail="Akses ditolak")
    else:
        raise HTTPException(status_code=403, detail="Role tidak dikenali")

    # 2. Ambil dokumen
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


@router.post(
    "/{id_pengajuan}/documents",
    status_code=status.HTTP_201_CREATED,
    summary="Upload dokumen pendukung tambahan",
    description="""
Upload file dokumen pendukung tambahan untuk pengajuan yang sudah ada.
Hanya pemilik pengajuan (client) yang boleh menambahkan dokumen.
Format: PDF / JPG / JPEG / PNG / WEBP / GIF. Maks 10MB per file.
""",
)
async def upload_document(
    id_pengajuan: int,
    dokumen_pendukung_files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # Hanya client yang boleh upload
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang dapat mengunggah dokumen")

    # Cek kepemilikan pengajuan
    pengajuan = db.table("pengajuan_konsultasi").select("id_user").eq("id_pengajuan", id_pengajuan).execute()
    if not pengajuan.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if pengajuan.data[0]["id_user"] != current_user["id_user"]:
        raise HTTPException(status_code=403, detail="Anda tidak berhak mengunggah dokumen untuk pengajuan ini")

    valid_files = [f for f in dokumen_pendukung_files if f.filename]
    if not valid_files:
        raise HTTPException(status_code=400, detail="Tidak ada file valid yang dikirim")
    if len(valid_files) > 10:
        raise HTTPException(status_code=400, detail="Maksimal 10 file per upload")

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


@router.delete(
    "/{id_pengajuan}/documents/{id_dokumen}",
    status_code=status.HTTP_200_OK,
    summary="Hapus dokumen pendukung",
    description="""
Menghapus satu dokumen pendukung berdasarkan `id_dokumen`.
Hanya pemilik pengajuan (client) yang boleh menghapus dokumen miliknya.
File juga akan dihapus dari Supabase Storage.
""",
)
def delete_document(
    id_pengajuan: int,
    id_dokumen: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # Hanya client yang boleh hapus
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang dapat menghapus dokumen")

    # Cek kepemilikan pengajuan
    pengajuan = db.table("pengajuan_konsultasi").select("id_user").eq("id_pengajuan", id_pengajuan).execute()
    if not pengajuan.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    if pengajuan.data[0]["id_user"] != current_user["id_user"]:
        raise HTTPException(status_code=403, detail="Anda tidak berhak menghapus dokumen untuk pengajuan ini")

    # Cek dokumen ada dan milik pengajuan ini
    doc = db.table("dokumen_pendukung").select("*").eq("id_dokumen", id_dokumen).eq("id_pengajuan", id_pengajuan).execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")

    doc_data = doc.data[0]
    file_url = doc_data.get("file_url", "")

    # Coba hapus file dari Supabase Storage
    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket
    
    try:
        # Ekstrak path dari public URL
        # Format URL: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
        if f"/storage/v1/object/public/{bucket_name}/" in file_url:
            storage_path = file_url.split(f"/storage/v1/object/public/{bucket_name}/")[1]
            db.storage.from_(bucket_name).remove([storage_path])
    except Exception as e:
        print(f"[WARN] Gagal hapus file dari storage: {e}")

    # Hapus record dari database
    db.table("dokumen_pendukung").delete().eq("id_dokumen", id_dokumen).execute()

    return {"message": "Dokumen berhasil dihapus", "id_dokumen": id_dokumen}