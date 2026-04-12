from fastapi import APIRouter, HTTPException, Depends, status
from supabase import Client
from database import get_supabase_client
from schemas.cases import CaseCreate, BidCreate
from dependencies import get_current_user

# Inisialisasi router HARUS di bagian atas sebelum digunakan oleh @router
router = APIRouter()


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Client posting kasus anonim ke bursa",
    description="""
Membuat kasus baru pada bursa kasus.

Khusus role client. Kasus yang berhasil diposting akan berstatus `open`
dan dapat dilihat oleh konsultan untuk melakukan bidding.
""",
)
def posting_kasus_anonim(
    request: CaseCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user.get("role") != "client":
        raise HTTPException(
            status_code=403, detail="Hanya klien yang dapat memposting kasus"
        )

    data_kasus = {
        "id_user": current_user["id_user"],
        # .lower() ini kuncinya! Jadi kalau kamu ngetik "Pidana", otomatis jadi "pidana"
        "kategori_hukum": request.kategori_hukum.lower().strip(),
        "deskripsi_kasus_awam": request.deskripsi_kasus_awam,
        "dokumen_bukti": request.dokumen_bukti,
        "status_bursa": "open",
    }

    response = db.table("bursa_kasus").insert(data_kasus).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Gagal memposting kasus")

    return {
        "message": "Kasus berhasil diposting secara anonim ke bursa",
        "data": response.data[0],
    }


@router.get(
    "/",
    summary="Konsultan melihat daftar bursa kasus open",
    description="Khusus role konsultan. Mengambil semua kasus bursa dengan status `open`.",
)
def lihat_bursa_kasus(
    current_user: dict = Depends(get_current_user),  # Tambahkan pengunci JWT
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


@router.post(
    "/{id_bursa}/bids",
    status_code=status.HTTP_201_CREATED,
    summary="Konsultan kirim penawaran bidding",
    description="Khusus role konsultan. Mengirim penawaran biaya dan pesan untuk satu kasus bursa.",
)
def kirim_penawaran_bidding(
    id_bursa: int,
    request: BidCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if current_user.get("role") != "konsultan":
        raise HTTPException(
            status_code=403, detail="Hanya konsultan yang bisa mengirim bid"
        )

    # 1. CARI ID_KONSULTAN YANG ASLI DARI TABEL KONSULTAN
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

    # 2. Cek apakah status bursa masih open
    kasus = (
        db.table("bursa_kasus")
        .select("status_bursa")
        .eq("id_bursa", id_bursa)
        .execute()
    )
    if not kasus.data or kasus.data[0]["status_bursa"] != "open":
        raise HTTPException(
            status_code=400, detail="Kasus tidak ditemukan atau bursa sudah ditutup"
        )

    # 3. Insert penawaran menggunakan ID Konsultan yang asli
    data_penawaran = {
        "id_bursa": id_bursa,
        "id_konsultan": real_id_konsultan,  # Pakai ID hasil pencarian tadi
        "pesan_tawaran": request.pesan_tawaran,
        "estimasi_biaya": request.estimasi_biaya,
        "status_penawaran": "menunggu",
    }

    response = db.table("penawaran_konsultan").insert(data_penawaran).execute()
    return {"message": "Penawaran berhasil dikirim", "data": response.data[0]}


#! ================= BOOKMARK ======================


@router.put(
    "/bids/{id_penawaran}/accept",
    summary="Client menerima penawaran konsultan",
    description="""
Saat client menerima satu penawaran:
- status bursa ditutup,
- status penawaran menjadi diterima,
- dibuat draf pengajuan konsultasi.
""",
)
def terima_penawaran(
    id_penawaran: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # 1. Ambil data bid untuk cari id_bursa & id_konsultan
    bid = (
        db.table("penawaran_konsultan")
        .select("*")
        .eq("id_penawaran", id_penawaran)
        .execute()
    )
    if not bid.data:
        raise HTTPException(status_code=404, detail="Penawaran tidak ditemukan")

    bid_data = bid.data[0]

    # 2. Update status bursa & penawaran
    db.table("bursa_kasus").update({"status_bursa": "closed"}).eq(
        "id_bursa", bid_data["id_bursa"]
    ).execute()
    db.table("penawaran_konsultan").update({"status_penawaran": "diterima"}).eq(
        "id_penawaran", id_penawaran
    ).execute()

    # Saat Client klik 'Accept'
    new_consultation = {
        "id_user": current_user["id_user"],
        "id_konsultan": bid_data["id_konsultan"],
        "id_bursa": bid_data["id_bursa"],
        "status_pengajuan": "pending",
        "deskripsi_kasus": "Hasil dari Bursa Kasus",
    }
    # Masukkan ke tabel muara (pengajuan_konsultasi)
    insert_response = (
        db.table("pengajuan_konsultasi").insert(new_consultation).execute()
    )

    return {
        "message": "Penawaran diterima, draf konsultasi dibuat",
        "data": insert_response.data[0] if insert_response.data else None,
    }


@router.get(
    "/{id_bursa}/bids",
    summary="Client melihat daftar penawaran untuk kasusnya",
    description="Menampilkan semua bid dari konsultan untuk kasus bursa tertentu milik client.",
)
def lihat_penawaran_masuk(
    id_bursa: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """
    (Khusus Client) Melihat semua bid yang masuk untuk kasus miliknya.
    """
    # Validasi: Pastikan yang melihat adalah pemilik kasus
    kasus = db.table("bursa_kasus").select("id_user").eq("id_bursa", id_bursa).execute()
    if not kasus.data or kasus.data[0]["id_user"] != current_user["id_user"]:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    # Ambil semua penawaran untuk bursa ini
    response = (
        db.table("penawaran_konsultan")
        .select("*, konsultan(nama_lengkap, spesialisasi)")
        .eq("id_bursa", id_bursa)
        .execute()
    )

    return {"message": "Daftar penawaran berhasil diambil", "data": response.data}
