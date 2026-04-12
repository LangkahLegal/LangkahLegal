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
async def buat_pengajuan_konsultasi(
    request: Request,
    id_jadwal: int | None = Form(default=None),
    deskripsi_kasus: str | None = Form(default=None),
    jam_mulai: str | None = Form(default=None),
    jam_selesai: str | None = Form(default=None),
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    (Khusus Client) Membuat pengajuan konsultasi dengan mengunci slot jadwal. 
    """
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang dapat membuat pengajuan")

    try:
        if request.headers.get("content-type", "").startswith("application/json"):
            body = await request.json()
            payload = ConsultationCreate(**body)
            id_jadwal = payload.id_jadwal
            deskripsi_kasus = payload.deskripsi_kasus
            jam_mulai_dt = payload.jam_mulai
            jam_selesai_dt = payload.jam_selesai
        else:
            if not jam_mulai or not jam_selesai:
                raise HTTPException(status_code=400, detail="jam_mulai dan jam_selesai wajib diisi (ISO 8601)")
            try:
                jam_mulai_dt = datetime.fromisoformat(jam_mulai.replace("Z", "+00:00"))
                jam_selesai_dt = datetime.fromisoformat(jam_selesai.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Format jam_mulai/jam_selesai tidak valid. Gunakan ISO 8601, contoh: 2026-04-13T09:00:00+07:00",
                )

        if id_jadwal is None or not deskripsi_kasus:
            raise HTTPException(status_code=400, detail="id_jadwal dan deskripsi_kasus wajib diisi")
        if jam_selesai_dt <= jam_mulai_dt:
            raise HTTPException(status_code=400, detail="jam_selesai harus lebih besar dari jam_mulai")

        # Gunakan format timestamp yang kompatibel untuk kolom SQL timestamp.
        jam_mulai_db = jam_mulai_dt.replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")
        jam_selesai_db = jam_selesai_dt.replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")

        # 1. Validasi ketersediaan jadwal
        jadwal = db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", id_jadwal).execute()

        if not jadwal.data:
            raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

        if not jadwal.data[0]["status_tersedia"]:
            raise HTTPException(status_code=400, detail="Jadwal sudah tidak tersedia atau telah dipesan")

        id_konsultan = jadwal.data[0]["id_konsultan"]

        # 2. Buat record pengajuan
        new_pengajuan = {
            "id_user": current_user["id_user"],
            "id_konsultan": id_konsultan,
            "id_jadwal": id_jadwal,
            "deskripsi_kasus": deskripsi_kasus,
            "jam_mulai": jam_mulai_db,
            "jam_selesai": jam_selesai_db,
            "status_pengajuan": "pending",
        }

        res_pengajuan = db.table("pengajuan_konsultasi").insert(new_pengajuan).execute()

        if not res_pengajuan.data:
            raise HTTPException(status_code=500, detail="Gagal membuat pengajuan")

        id_pengajuan = res_pengajuan.data[0]["id_pengajuan"]

        dokumen_data = []
        if dokumen_pendukung_files:
            settings = get_settings()
            for doc_file in dokumen_pendukung_files:
                doc_meta = await upload_supporting_document_to_supabase(
                    file=doc_file,
                    id_pengajuan=id_pengajuan,
                    id_user=current_user["id_user"],
                    db_client=db,
                    bucket_name=settings.supabase_berkas_pendukung_bucket,
                )
                dokumen_data.append({
                    "id_pengajuan": id_pengajuan,
                    **doc_meta,
                })

        if dokumen_data:
            insert_dokumen = db.table("dokumen_pendukung").insert(dokumen_data).execute()
            if not insert_dokumen.data:
                raise HTTPException(status_code=500, detail="Gagal menyimpan metadata dokumen pendukung")

        # 3. Update status jadwal menjadi FALSE (dikunci)
        db.table("jadwal_ketersediaan").update({"status_tersedia": False}).eq("id_jadwal", id_jadwal).execute()

        return {
            "message": "Pengajuan dibuat, menunggu persetujuan konsultan.",
            "data": {
                "id_pengajuan": id_pengajuan,
                "status_pengajuan": "pending",
                "dokumen_pendukung": dokumen_data,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal membuat pengajuan konsultasi: {str(exc)}",
        )
    
@router.put(
    "/{id_pengajuan}/respond",
    status_code=status.HTTP_200_OK,
    summary="Konsultan merespons pengajuan (setujui/tolak)",
    description="""
Khusus role konsultan untuk mengubah keputusan pengajuan:
- `disetujui` -> status menjadi `menunggu_pembayaran`.
- `ditolak` -> status menjadi `ditolak` dan slot jadwal dibuka kembali.
""",
)
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