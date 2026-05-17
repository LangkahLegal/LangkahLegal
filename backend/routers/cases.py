from fastapi import APIRouter, HTTPException, Depends, File, Form, UploadFile, status
from supabase import Client
from database import get_supabase_client
from dependencies import get_current_user
from config import get_settings
from services import upload_supporting_document_to_supabase
from typing import Optional

# Inisialisasi router HARUS di bagian atas sebelum digunakan oleh @router
router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Client posting kasus anonim ke bursa (dengan file upload)",
    description="""
Membuat kasus baru pada bursa kasus.

Khusus role client. Kasus yang berhasil diposting akan berstatus `open`
dan dapat diklaim langsung oleh konsultan.

Mendukung upload file dokumen pendukung (opsional).
Gunakan field `dokumen_pendukung_files` untuk upload file (bisa lebih dari satu).
Format yang diizinkan: PDF / JPG / JPEG / PNG / WEBP.
""",
)
async def posting_kasus_anonim(
    kategori_hukum: str = Form(...),
    deskripsi_kasus_awam: str = Form(...),
    tanggal_konsultasi: str = Form(...),
    jam_mulai: str = Form(...),
    jam_selesai: str = Form(...),
    dokumen_bukti: Optional[str] = Form(default=None),
    dokumen_pendukung_files: list[UploadFile] | None = File(default=None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user.get("role") != "client":
        raise HTTPException(
            status_code=403, detail="Hanya klien yang dapat memposting kasus"
        )

    # Validasi jumlah file (maks 10)
    if dokumen_pendukung_files:
        valid_files = [f for f in dokumen_pendukung_files if f.filename]
        if len(valid_files) > 10:
            raise HTTPException(status_code=400, detail="Maksimal 10 file dokumen pendukung")
    else:
        valid_files = []

    # 1. Insert data kasus ke bursa
    data_kasus = {
        "id_user": current_user["id_user"],
        "kategori_hukum": kategori_hukum.lower().strip(),
        "deskripsi_kasus_awam": deskripsi_kasus_awam,
        "dokumen_bukti": dokumen_bukti,
        "tanggal_konsultasi": tanggal_konsultasi,
        "jam_mulai": jam_mulai,
        "jam_selesai": jam_selesai,
        "status_bursa": "open",
    }

    response = db.table("bursa_kasus").insert(data_kasus).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Gagal memposting kasus")

    id_bursa = response.data[0]["id_bursa"]

    # 2. Upload dokumen pendukung ke Supabase bucket (jika ada)
    settings = get_settings()
    bucket_name = settings.supabase_berkas_pendukung_bucket
    uploaded_docs = []
    failed_docs = []
    file_urls = []

    for file in valid_files:
        try:
            doc_meta = await upload_supporting_document_to_supabase(
                file=file,
                id_pengajuan=id_bursa,  # reuse helper, pakai id_bursa sebagai identifier
                id_user=current_user["id_user"],
                db_client=db,
                bucket_name=bucket_name,
            )
            uploaded_docs.append(doc_meta["nama_dokumen"])
            file_urls.append(doc_meta["file_url"])
        except Exception as e:
            failed_docs.append({"nama": file.filename, "alasan": str(e)})

    # Update dokumen_bukti dengan URL file yang berhasil diupload
    if file_urls:
        combined = dokumen_bukti or ""
        if combined:
            combined += ","
        combined += ",".join(file_urls)
        db.table("bursa_kasus").update({"dokumen_bukti": combined}).eq("id_bursa", id_bursa).execute()

    return {
        "message": "Kasus berhasil diposting secara anonim ke bursa",
        "data": response.data[0],
        "dokumen_terupload": uploaded_docs,
        "dokumen_gagal": failed_docs,
    }


@router.get(
    "/",
    summary="Konsultan melihat daftar bursa kasus open",
    description="Khusus role konsultan. Mengambil semua kasus bursa dengan status `open`.",
)
def lihat_bursa_kasus(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    (Khusus Konsultan) Endpoint untuk melihat semua kasus yang masih 'open'.
    """
    if current_user.get("role") != "konsultan":
        raise HTTPException(
            status_code=403, detail="Hanya konsultan yang bisa melihat bursa"
        )

    response = db.table("bursa_kasus").select("*").eq("status_bursa", "open").execute()
    return {"message": "Berhasil mengambil data bursa kasus", "data": response.data}


# ================= DIRECT CLAIM (Klaim Langsung) ======================


@router.post(
    "/{id_bursa}/claim",
    status_code=status.HTTP_201_CREATED,
    summary="Konsultan klaim langsung sebuah kasus dari bursa",
    description="""
Khusus role konsultan. Konsultan langsung mengambil/mengklaim kasus dari bursa.

Saat klaim berhasil:
- Status bursa berubah menjadi `closed`.
- Otomatis dibuatkan draf pengajuan konsultasi (tabel `pengajuan_konsultasi`).
""",
)
def klaim_kasus(
    id_bursa: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # 0. Pastikan yang mengakses adalah konsultan
    if current_user.get("role") != "konsultan":
        raise HTTPException(
            status_code=403, detail="Hanya konsultan yang bisa mengklaim kasus"
        )

    # 1. Cari id_konsultan asli dari tabel konsultan berdasarkan id_user JWT
    konsultan_profile = (
        db.table("konsultan")
        .select("id_konsultan")
        .eq("id_user", current_user["id_user"])
        .execute()
    )

    if not konsultan_profile.data:
        raise HTTPException(
            status_code=404,
            detail="Profil konsultan tidak ditemukan. Pastikan Anda sudah terdaftar sebagai konsultan.",
        )

    real_id_konsultan = konsultan_profile.data[0]["id_konsultan"]

    # 2. Cek apakah kasus bursa masih open
    kasus = (
        db.table("bursa_kasus")
        .select("id_bursa, id_user, status_bursa, deskripsi_kasus_awam, tanggal_konsultasi, jam_mulai, jam_selesai, dokumen_bukti")
        .eq("id_bursa", id_bursa)
        .execute()
    )

    if not kasus.data:
        raise HTTPException(status_code=404, detail="Kasus bursa tidak ditemukan")

    kasus_data = kasus.data[0]

    if kasus_data["status_bursa"] != "open":
        raise HTTPException(
            status_code=400,
            detail="Kasus ini sudah diklaim oleh konsultan lain",
        )

    # 3. Cek bentrok jadwal untuk konsultan
    kasus_date = (kasus_data.get("tanggal_konsultasi") or "").split("T")[0]
    kasus_start = kasus_data.get("jam_mulai", "00:00")[:5]
    kasus_end = kasus_data.get("jam_selesai", "00:00")[:5]
    
    if kasus_date and kasus_start and kasus_end:
        active_consultations = (
            db.table("pengajuan_konsultasi")
            .select("jam_mulai, jam_selesai, jadwal_ketersediaan(tanggal, jam_mulai, jam_selesai), tanggal_pengajuan")
            .eq("id_konsultan", real_id_konsultan)
            .in_("status_pengajuan", ["pending", "menunggu_pembayaran", "terjadwal"])
            .execute()
        )
        
        for active in active_consultations.data:
            active_jadwal = active.get("jadwal_ketersediaan") or {}
            
            a_date_raw = active_jadwal.get("tanggal") or active.get("tanggal_pengajuan")
            a_date = (a_date_raw or "").split("T")[0]
            
            if not a_date or a_date != kasus_date:
                continue
                
            a_start = (active.get("jam_mulai") or active_jadwal.get("jam_mulai") or "00:00")[:5]
            a_end = (active.get("jam_selesai") or active_jadwal.get("jam_selesai") or "00:00")[:5]
            
            if kasus_start < a_end and kasus_end > a_start:
                raise HTTPException(
                    status_code=400,
                    detail=f"Gagal klaim: Anda sudah memiliki jadwal konsultasi aktif yang bertabrakan pada {kasus_date} jam {a_start}-{a_end}."
                )

    # 4. Tutup bursa → status menjadi 'closed'
    db.table("bursa_kasus").update({"status_bursa": "closed"}).eq(
        "id_bursa", id_bursa
    ).execute()

    new_consultation = {
        "id_user": kasus_data["id_user"],
        "id_konsultan": real_id_konsultan,
        "id_bursa": id_bursa,
        "status_pengajuan": "terjadwal",
        "deskripsi_kasus": kasus_data.get("deskripsi_kasus_awam", "Hasil dari Bursa Kasus"),
        "tanggal_pengajuan": kasus_data.get("tanggal_konsultasi"),
        "jam_mulai": kasus_data.get("jam_mulai"),
        "jam_selesai": kasus_data.get("jam_selesai"),
    }

    insert_response = (
        db.table("pengajuan_konsultasi").insert(new_consultation).execute()
    )

    if not insert_response.data:
        # Rollback: buka kembali bursa jika insert gagal
        db.table("bursa_kasus").update({"status_bursa": "open"}).eq(
            "id_bursa", id_bursa
        ).execute()
        raise HTTPException(
            status_code=500,
            detail="Gagal membuat draf konsultasi. Silakan coba lagi.",
        )

    return {
        "message": "Kasus berhasil diklaim. Draf konsultasi telah dibuat.",
        "data": insert_response.data[0],
    }
