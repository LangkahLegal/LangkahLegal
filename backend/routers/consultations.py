from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from database import get_supabase_client
from schemas.consultations import ConsultationCreate, ConsultationRespond, ConsultationRating
from dependencies import get_current_user
from pydantic import BaseModel # Tambahkan ini

router = APIRouter()

class RatingCreate(BaseModel):
    skor: int # 1-5
    ulasan: str
    
@router.post("/", status_code=status.HTTP_201_CREATED)
def buat_pengajuan_konsultasi(
    request: ConsultationCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """
    (Khusus Client) Membuat pengajuan konsultasi dengan mengunci slot jadwal. 
    """
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang dapat membuat pengajuan")

    # 1. Validasi ketersediaan jadwal 
    jadwal = db.table("jadwal_ketersediaan").select("*").eq("id_jadwal", request.id_jadwal).execute()
    
    if not jadwal.data:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    
    if not jadwal.data[0]["status_tersedia"]:
        raise HTTPException(status_code=400, detail="Jadwal sudah tidak tersedia atau telah dipesan")

    id_konsultan = jadwal.data[0]["id_konsultan"]

    # 2. Buat record pengajuan [cite: 170]
    new_pengajuan = {
        "id_user": current_user["id_user"],
        "id_konsultan": id_konsultan,
        "id_jadwal": request.id_jadwal,
        "deskripsi_kasus": request.deskripsi_kasus,
        "status_pengajuan": "pending" # Default status awal [cite: 186]
    }
    
    res_pengajuan = db.table("pengajuan_konsultasi").insert(new_pengajuan).execute()
    
    if not res_pengajuan.data:
        raise HTTPException(status_code=500, detail="Gagal membuat pengajuan")

    # 3. Update status jadwal menjadi FALSE (dikunci) [cite: 170]
    db.table("jadwal_ketersediaan").update({"status_tersedia": False}).eq("id_jadwal", request.id_jadwal).execute()

    return {
        "message": "Pengajuan dibuat, menunggu persetujuan konsultan.", # [cite: 183]
        "data": {
            "id_pengajuan": res_pengajuan.data[0]["id_pengajuan"], # [cite: 185]
            "status_pengajuan": "pending" # [cite: 186]
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
    if request.keputusan.lower() == "disetujui":
        new_status = "menunggu_pembayaran" [cite: 196]
        message = "Pengajuan disetujui. Menunggu pembayaran klien."
    elif request.keputusan.lower() == "ditolak":
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
    
@router.get("/", status_code=status.HTTP_200_OK)
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
    
@router.get("/{id_pengajuan}", status_code=status.HTTP_200_OK)
def get_detail_pengajuan(
    id_pengajuan: int,
    db: Client = Depends(get_supabase_client)
):
    # JOIN ke jadwal dan konsultan/users untuk info lengkap
    response = db.table("pengajuan_konsultasi")\
        .select("*, jadwal_ketersediaan(*), users(nama, email)")\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Detail tidak ditemukan")

    return {"data": response.data[0]}
    
@router.post("/{id_pengajuan}/rating")
def beri_rating_konsultasi(
    id_pengajuan: int,
    request: RatingCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang bisa memberi rating")

    # Pastikan konsultasi sudah selesai
    cek = db.table("pengajuan_konsultasi").select("status_pengajuan").eq("id_pengajuan", id_pengajuan).single().execute()
    
    if cek.data["status_pengajuan"] != "completed":
        raise HTTPException(status_code=400, detail="Rating hanya bisa diberikan setelah konsultasi selesai")

    response = db.table("pengajuan_konsultasi")\
        .update({"rating": request.skor, "ulasan": request.ulasan})\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    return {"message": "Terima kasih atas penilaian Anda!"}

@router.put("/{id_pengajuan}/status")
def update_consultation_status(
    id_pengajuan: int,
    new_status: str, # Misal: 'accepted', 'rejected', 'completed'
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    if current_user.get("role") != "konsultan":
        raise HTTPException(status_code=403, detail="Hanya konsultan yang bisa mengubah status")

    response = db.table("pengajuan_konsultasi")\
        .update({"status": new_status})\
        .eq("id_pengajuan", id_pengajuan)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    return {"message": f"Status berhasil diubah menjadi {new_status}"}