from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from supabase import Client
from database import get_supabase_client
from schemas.consultations import ConsultationCreate, ConsultationRespond, RatingCreate
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
@router.post("/")
async def buat_pengajuan_konsultasi(
    id_jadwal: int = Form(...), 
    deskripsi_kasus: str = Form(...),
    jam_mulai: str = Form(...),
    jam_selesai: str = Form(...),
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    print(f"DEBUG DATA: {id_jadwal}")
    # Security check: Hanya client yang boleh submit
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang dapat membuat pengajuan")

    # 1. READ ONLY: Ambil data jadwal ketersediaan untuk validasi range jam
    # Kita butuh ini cuma buat mastiin jam yang di-input client nggak ngaco (di luar jam kerja konsultan)
    jadwal = db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()
    
    if not jadwal.data:
        raise HTTPException(status_code=404, detail="Jadwal ketersediaan tidak ditemukan")
    
    data_jadwal = jadwal.data[0]
    
    # 2. Validasi Jam (Bandingkan jam_mulai/selesai dari Frontend vs Master Jadwal)
    # Kita tetap validasi agar tidak ada pengajuan di luar jam operasional konsultan
    if jam_mulai < data_jadwal["jam_mulai"] or jam_selesai > data_jadwal["jam_selesai"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Jam di luar rentang operasional ({data_jadwal['jam_mulai']} - {data_jadwal['jam_selesai']})"
        )

    # 3. Buat record pengajuan di tabel pengajuan_konsultasi
    new_pengajuan = {
        "id_user": current_user["id_user"],
        "id_konsultan": data_jadwal["id_konsultan"],
        "id_jadwal": id_jadwal,
        "jam_mulai": jam_mulai, 
        "jam_selesai": jam_selesai, 
        "deskripsi_kasus": deskripsi_kasus,
        "status_pengajuan": "pending" 
    }
    
    res_pengajuan = db.table("pengajuan_konsultasi").insert(new_pengajuan).execute()
    
    if not res_pengajuan.data:
        raise HTTPException(status_code=500, detail="Gagal menyimpan data pengajuan")

    # --- TABEL JADWAL_KETERSEDIAAN TIDAK DISENTUH SAMA SEKALI (TIDAK ADA UPDATE) ---

    return {
        "message": "Pengajuan berhasil dikirim.",
        "data": {
            "id_pengajuan": res_pengajuan.data[0]["id_pengajuan"],
            "jam_diajukan": f"{jam_mulai} - {jam_selesai}",
            "status": "pending"
        }
    }

@router.put("/{id_pengajuan}/respond", status_code=status.HTTP_200_OK)
def respond_konsultasi(
    id_pengajuan: int,
    request: ConsultationRespond,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    (Khusus Konsultan) Menyetujui atau menolak pengajuan jadwal konsultasi. [cite: 190-191]
    """
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa merespons pengajuan")

    # 1. Ambil data pengajuan
    pengajuan = db.table("pengajuan_konsultasi").select("*").eq("id_pengajuan", id_pengajuan).execute()
    
    if not pengajuan.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")
    
    id_jadwal = pengajuan.data[0]["id_jadwal"]

    # 2. Logika Keputusan
    if request.status_persetujuan.lower() == "disetujui":
        new_status = "menunggu_pembayaran"
        message = "Pengajuan disetujui. Menunggu pembayaran klien."
    elif request.status_persetujuan.lower() == "ditolak":
        new_status = "ditolak"
        message = "Pengajuan ditolak. Slot jadwal telah dibuka kembali."
        # Kembalikan status jadwal menjadi TRUE 
        db.table("jadwal_ketersediaan").update({"status_tersedia": True}).eq("id_jadwal", id_jadwal).execute()
    else:
        raise HTTPException(status_code=400, detail="Keputusan tidak valid (gunakan 'disetujui' atau 'ditolak')")

    # 3. Update status pengajuan
    response = db.table("pengajuan_konsultasi")\
        .update({"status_pengajuan": new_status})\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    return {
        "message": message,
        "data": response.data[0]
    }
    
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
    # Join bertingkat: pengajuan -> jadwal -> konsultan -> users (untuk ambil nama)
    query = db.table("pengajuan_konsultasi").select("""
        *,
        dokumen_pendukung (
            id_dokumen, nama_dokumen, file_url, tipe_file, ukuran_kb, created_at, updated_at
        ),
        jadwal_ketersediaan (
            tanggal, jam_mulai, jam_selesai,
            konsultan (
                nama_lengkap, spesialisasi
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
            jadwal_ketersediaan(*),
            users(nama, email),
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

    return {"data": response.data[0]}
    
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

@router.put(
    "/{id_pengajuan}/status",
    summary="Konsultan mengubah status pengajuan",
    description="""
Endpoint utilitas untuk update status pengajuan oleh konsultan.

Contoh nilai `new_status`: `pending`, `menunggu_pembayaran`, `ditolak`, `completed`.
Frontend disarankan tetap mengikuti workflow bisnis yang sudah ditetapkan.
""",
)
def update_consultation_status(
    id_pengajuan: int,
    new_status: str, # Misal: 'accepted', 'rejected', 'completed'
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa mengubah status")

    response = db.table("pengajuan_konsultasi")\
        .update({"status_pengajuan": new_status})\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    return {"message": f"Status berhasil diubah menjadi {new_status}"}


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