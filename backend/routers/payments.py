import time
from datetime import datetime, timedelta

import midtransclient
from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from config import Settings, get_settings
from database import get_supabase_client
from dependencies import get_current_user
from schemas.payments import CreateTransactionRequest

router = APIRouter()


def _get_snap_client(settings: Settings) -> midtransclient.Snap:
    """Inisialisasi Midtrans Snap client dari config."""
    return midtransclient.Snap(
        is_production=settings.midtrans_is_production,
        server_key=settings.midtrans_server_key,
        client_key=settings.midtrans_client_key,
    )


def _get_core_api_client(settings: Settings) -> midtransclient.CoreApi:
    """Inisialisasi Midtrans Core API client untuk verifikasi webhook."""
    return midtransclient.CoreApi(
        is_production=settings.midtrans_is_production,
        server_key=settings.midtrans_server_key,
        client_key=settings.midtrans_client_key,
    )


# ============================================================
# 1. CREATE TRANSACTION — Client memulai pembayaran
# ============================================================
@router.post(
    "/create-transaction",
    status_code=status.HTTP_201_CREATED,
    summary="Buat transaksi pembayaran Midtrans",
    description="""
Membuat transaksi Snap Midtrans untuk pengajuan konsultasi yang sudah disetujui konsultan.

Syarat:
- Hanya role `client` yang boleh memanggil.
- Status pengajuan harus `menunggu_pembayaran`.
- Tarif diambil otomatis dari `konsultan.tarif_per_sesi`.

Response berisi `snap_token` yang digunakan frontend untuk membuka popup pembayaran Midtrans.
""",
)
def create_transaction(
    payload: CreateTransactionRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    # 1. Validasi role
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang bisa melakukan pembayaran")

    # 2. Ambil data pengajuan
    try:
        pengajuan_res = (
            db.table("pengajuan_konsultasi")
            .select("*, konsultan(tarif_per_sesi, nama_lengkap), users(nama, email)")
            .eq("id_pengajuan", payload.id_pengajuan)
            .eq("id_user", current_user["id_user"])
            .limit(1)
            .execute()
        )
    except Exception as e:
        print(f"[ERROR] Gagal query pengajuan: {e}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data pengajuan")

    if not pengajuan_res.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    pengajuan = pengajuan_res.data[0]

    # 3. Validasi status — izinkan bayar/bayar ulang dari status berikut:
    #    - menunggu_pembayaran: konsultan baru approve
    #    - pembayaran_gagal: pembayaran sebelumnya gagal (legacy)
    #    - kedaluwarsa: pembayaran sebelumnya expire
    #    - dibatalkan: pembayaran sebelumnya di-cancel oleh client
    PAYABLE_STATUSES = ["menunggu_pembayaran", "pembayaran_gagal", "kedaluwarsa", "dibatalkan"]
    if pengajuan["status_pengajuan"] not in PAYABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Pengajuan tidak dalam status yang memerlukan pembayaran (status saat ini: {pengajuan['status_pengajuan']})",
        )

    # 4. Cek apakah sudah ada transaksi pending untuk pengajuan ini
    existing_tx = (
        db.table("transaksi")
        .select("*")
        .eq("id_pengajuan", payload.id_pengajuan)
        .eq("status_pembayaran", "pending")
        .execute()
    )

    if existing_tx.data:
        tx = existing_tx.data[0]
        # Double check status ke Midtrans untuk memastikan token belum expired
        api_client = _get_core_api_client(settings)
        try:
            status_response = api_client.transactions.status(tx["order_id"])
            tx_status = status_response.get("transaction_status")
            
            if tx_status in ("cancel", "deny", "expire"):
                # Update DB menjadi batal/kedaluwarsa, lalu lanjut buat transaksi KEDUA
                db.table("transaksi").update({
                    "status_pembayaran": tx_status,
                    "updated_at": datetime.now().isoformat()
                }).eq("order_id", tx["order_id"]).execute()
                print(f"[INFO] Transaksi sebelumnya ternyata {tx_status}, membuat token baru...")
            else:
                # Masih valid/pending, kembalikan snap_token yang ada
                if tx.get("snap_token"):
                    return {
                        "snap_token": tx["snap_token"],
                        "redirect_url": tx.get("snap_redirect_url", ""),
                        "order_id": tx["order_id"],
                    }
        except Exception as e:
            # Jika transaksi belum ada di sisi Midtrans (misal belum klik payment method sama sekali),
            # API status() akan error 404. Ini berarti token Snap MASIH VALID & belum dipilih methodnya.
            if "404" in str(e):
                if tx.get("snap_token"):
                    return {
                        "snap_token": tx["snap_token"],
                        "redirect_url": tx.get("snap_redirect_url", ""),
                        "order_id": tx["order_id"],
                    }
            else:
                print(f"[WARN] Failed to check status for existing tx {tx['order_id']}: {e}")
    # 5. Hitung nominal
    konsultan_data = pengajuan.get("konsultan") or {}
    tarif = konsultan_data.get("tarif_per_sesi")

    if not tarif or float(tarif) <= 0:
        raise HTTPException(status_code=400, detail="Tarif konsultan belum diatur")

    gross_amount = int(float(tarif))

    # Hitung komisi platform (10%) dan nominal konsultan (90%)
    komisi_platform = int(gross_amount * 0.10)
    nominal_konsultan = gross_amount - komisi_platform

    # 6. Generate unique order_id
    order_id = f"LL-{payload.id_pengajuan}-{int(time.time())}"

    # 7. Siapkan customer details
    user_data = pengajuan.get("users") or {}
    customer_details = {
        "first_name": user_data.get("nama", "Client"),
        "email": user_data.get("email", "client@langkahlegal.com"),
    }

    # 8. Buat transaksi Midtrans Snap
    snap = _get_snap_client(settings)

    transaction_param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
        "customer_details": customer_details,
        "expiry": {
            "unit": "hour",
            "duration": 1,
        },
    }

    try:
        snap_response = snap.create_transaction(transaction_param)
    except Exception as e:
        print(f"[ERROR] Midtrans Snap create_transaction failed: {e}")
        raise HTTPException(status_code=502, detail=f"Gagal membuat transaksi pembayaran: {str(e)}")

    snap_token = snap_response.get("token", "")
    redirect_url = snap_response.get("redirect_url", "")

    # 9. Simpan ke tabel transaksi
    try:
        db.table("transaksi").insert({
            "id_pengajuan": payload.id_pengajuan,
            "order_id": order_id,
            "gross_amount": gross_amount,
            "nominal_konsultan": nominal_konsultan,
            "komisi_platform": komisi_platform,
            "status_pembayaran": "pending",
            "snap_token": snap_token,
            "snap_redirect_url": redirect_url,
        }).execute()
    except Exception as e:
        print(f"[ERROR] Gagal menyimpan transaksi ke DB: {e}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan data transaksi")

    return {
        "snap_token": snap_token,
        "redirect_url": redirect_url,
        "order_id": order_id,
    }


# ============================================================
# 2. NOTIFICATION WEBHOOK — Midtrans server-to-server callback
# ============================================================
@router.post(
    "/notification",
    status_code=status.HTTP_200_OK,
    summary="Webhook notifikasi pembayaran dari Midtrans",
    description="""
Endpoint ini dipanggil oleh server Midtrans secara otomatis saat status pembayaran berubah.

**PENTING**: Endpoint ini TIDAK memerlukan autentikasi user (Bearer token).
Verifikasi dilakukan oleh Midtrans SDK menggunakan server key + signature key.

URL ini harus didaftarkan di Midtrans Dashboard:
- Settings → Payment Notification URL
- Format: `https://your-domain.com/api/v1/payments/notification`
""",
)
async def midtrans_notification(
    request: Request,
    db: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    # 1. Parse notification JSON dari Midtrans
    try:
        notification_json = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    print(f"[MIDTRANS WEBHOOK] Received notification: {notification_json}")

    # 2. Verifikasi notifikasi menggunakan Midtrans SDK
    api_client = _get_core_api_client(settings)

    try:
        status_response = api_client.transactions.notification(notification_json)
    except Exception as e:
        print(f"[ERROR] Midtrans notification verification failed: {e}")
        raise HTTPException(status_code=400, detail="Verifikasi notifikasi gagal")

    order_id = status_response.get("order_id", "")
    transaction_status = status_response.get("transaction_status", "")
    fraud_status = status_response.get("fraud_status", "")
    payment_type = status_response.get("payment_type", "")
    transaction_id = status_response.get("transaction_id", "")

    print(f"[MIDTRANS WEBHOOK] Order: {order_id}, Status: {transaction_status}, Fraud: {fraud_status}")

    # 3. Cari transaksi di database
    tx_res = (
        db.table("transaksi")
        .select("*, pengajuan_konsultasi(id_pengajuan, status_pengajuan)")
        .eq("order_id", order_id)
        .execute()
    )

    if not tx_res.data:
        print(f"[WARN] Transaksi dengan order_id '{order_id}' tidak ditemukan di DB")
        return {"status": "ok", "message": "Order not found, ignored"}

    tx = tx_res.data[0]
    id_pengajuan = tx["id_pengajuan"]
    current_payment_status = tx.get("status_pembayaran", "")

    # 4. Guard: Jangan proses ulang transaksi yang sudah final
    #    Mencegah double-webhook mengubah status yang sudah settlement/cancel/refund
    FINAL_STATUSES = ("settlement", "cancel", "refund")
    if current_payment_status in FINAL_STATUSES:
        print(f"[MIDTRANS WEBHOOK] Transaksi {order_id} sudah final ({current_payment_status}), skip.")
        return {"status": "ok", "message": f"Already {current_payment_status}"}

    # 5. Tentukan status pembayaran baru berdasarkan notifikasi Midtrans
    #
    # Mapping Midtrans → status_pembayaran_enum × status_pengajuan_enum:
    #   capture+accept / settlement  → settlement   × terjadwal
    #   cancel / deny                → cancel        × dibatalkan
    #   expire                       → expire        × kedaluwarsa
    #   pending                      → pending       × (tidak diubah)
    #   refund                       → refund        × dibatalkan
    #   capture+challenge            → pending       × (tidak diubah, tunggu review)
    #
    new_payment_status = None
    new_pengajuan_status = None

    if transaction_status == "capture":
        if fraud_status == "accept":
            new_payment_status = "settlement"
            new_pengajuan_status = "terjadwal"
        elif fraud_status == "challenge":
            new_payment_status = "pending"
    elif transaction_status == "settlement":
        new_payment_status = "settlement"
        new_pengajuan_status = "terjadwal"
    elif transaction_status in ("cancel", "deny"):
        new_payment_status = "cancel"
        new_pengajuan_status = "dibatalkan"
    elif transaction_status == "expire":
        new_payment_status = "expire"
        new_pengajuan_status = "kedaluwarsa"
    elif transaction_status == "pending":
        new_payment_status = "pending"
    elif transaction_status == "refund":
        new_payment_status = "refund"
        new_pengajuan_status = "dibatalkan"

    # 6. Update tabel transaksi
    if new_payment_status:
        update_data = {
            "status_pembayaran": new_payment_status,
            "metode_pembayaran": payment_type,
            "updated_at": datetime.now().isoformat(),
        }

        if new_payment_status == "settlement":
            update_data["waktu_bayar"] = datetime.now().isoformat()

        db.table("transaksi").update(update_data).eq("order_id", order_id).execute()
        print(f"[MIDTRANS WEBHOOK] Transaksi {order_id} diupdate ke {new_payment_status}")

    # 7. Update status pengajuan konsultasi
    if new_pengajuan_status:
        db.table("pengajuan_konsultasi").update({
            "status_pengajuan": new_pengajuan_status,
            "updated_at": datetime.now().isoformat(),
        }).eq("id_pengajuan", id_pengajuan).execute()
        print(f"[MIDTRANS WEBHOOK] Pengajuan {id_pengajuan} diupdate ke {new_pengajuan_status}")

    return {"status": "ok"}


# ============================================================
# 3. CEK STATUS PEMBAYARAN — Client/Konsultan cek status
# ============================================================
@router.get(
    "/status/{id_pengajuan}",
    status_code=status.HTTP_200_OK,
    summary="Cek status pembayaran",
    description="""
Mengambil status pembayaran terakhir untuk suatu pengajuan konsultasi.
Bisa dipanggil oleh client (pemilik pengajuan) atau konsultan terkait.
""",
)
def get_payment_status(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    # Validasi akses: pastikan user terkait pengajuan ini
    try:
        pengajuan_res = (
            db.table("pengajuan_konsultasi")
            .select("id_pengajuan, id_user, id_konsultan")
            .eq("id_pengajuan", id_pengajuan)
            .limit(1)
            .execute()
        )
    except Exception as e:
        print(f"[ERROR] Gagal query pengajuan: {e}")
        raise HTTPException(status_code=500, detail="Gagal mengambil data pengajuan")

    if not pengajuan_res.data:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    pengajuan = pengajuan_res.data[0]
    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == "client" and pengajuan["id_user"] != user_id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    elif user_role == "konsultan":
        kons_res = (
            db.table("konsultan")
            .select("id_konsultan")
            .eq("id_user", user_id)
            .limit(1)
            .execute()
        )
        if not kons_res.data or kons_res.data[0]["id_konsultan"] != pengajuan["id_konsultan"]:
            raise HTTPException(status_code=403, detail="Akses ditolak")

    # Ambil data transaksi terbaru
    tx_res = (
        db.table("transaksi")
        .select("*")
        .eq("id_pengajuan", id_pengajuan)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not tx_res.data:
        return {"data": None, "message": "Belum ada transaksi pembayaran"}

    return {"data": tx_res.data[0]}


# ============================================================
# 4. SYNC STATUS — Frontend fallback saat webhook belum sampai
# ============================================================
@router.post(
    "/sync/{id_pengajuan}",
    status_code=status.HTTP_200_OK,
    summary="Sinkronisasi status pembayaran dari Midtrans",
    description="""
Endpoint ini dipanggil oleh frontend setelah Snap popup `onSuccess` / `onPending`.

Karena webhook Midtrans bisa terlambat (atau tidak sampai jika ngrok mati),
endpoint ini langsung query status ke Midtrans Core API berdasarkan order_id,
lalu update tabel `transaksi` dan `pengajuan_konsultasi` sesuai hasilnya.

Ini adalah mekanisme **fallback** — webhook tetap jadi primary.
""",
)
def sync_payment_status(
    id_pengajuan: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
    settings: Settings = Depends(get_settings),
):
    # 1. Validasi role
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Hanya klien yang bisa sinkronisasi pembayaran")

    # 2. Cari transaksi terbaru untuk pengajuan ini
    tx_res = (
        db.table("transaksi")
        .select("*")
        .eq("id_pengajuan", id_pengajuan)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not tx_res.data:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")

    tx = tx_res.data[0]
    order_id = tx["order_id"]
    current_status = tx.get("status_pembayaran", "")

    # 3. Jika sudah final, skip
    if current_status in ("settlement", "cancel", "refund"):
        return {
            "synced": False,
            "message": f"Status sudah final: {current_status}",
            "status_pembayaran": current_status,
        }

    # 4. Query status langsung ke Midtrans Core API
    api_client = _get_core_api_client(settings)

    try:
        midtrans_status = api_client.transactions.status(order_id)
    except Exception as e:
        print(f"[SYNC] Gagal query Midtrans status for {order_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Gagal cek status ke Midtrans: {str(e)}")

    transaction_status = midtrans_status.get("transaction_status", "")
    fraud_status = midtrans_status.get("fraud_status", "")
    payment_type = midtrans_status.get("payment_type", "")

    print(f"[SYNC] Order {order_id}: midtrans_status={transaction_status}, fraud={fraud_status}")

    # 5. Tentukan status baru (mapping sama dengan webhook)
    new_payment_status = None
    new_pengajuan_status = None

    if transaction_status == "capture":
        if fraud_status == "accept":
            new_payment_status = "settlement"
            new_pengajuan_status = "terjadwal"
    elif transaction_status == "settlement":
        new_payment_status = "settlement"
        new_pengajuan_status = "terjadwal"
    elif transaction_status in ("cancel", "deny"):
        new_payment_status = "cancel"
        new_pengajuan_status = "dibatalkan"
    elif transaction_status == "expire":
        new_payment_status = "expire"
        new_pengajuan_status = "kedaluwarsa"
    elif transaction_status == "pending":
        new_payment_status = "pending"

    # 6. Update DB jika ada perubahan
    if new_payment_status and new_payment_status != current_status:
        update_data = {
            "status_pembayaran": new_payment_status,
            "metode_pembayaran": payment_type,
            "updated_at": datetime.now().isoformat(),
        }
        if new_payment_status == "settlement":
            update_data["waktu_bayar"] = datetime.now().isoformat()

        db.table("transaksi").update(update_data).eq("order_id", order_id).execute()

        if new_pengajuan_status:
            db.table("pengajuan_konsultasi").update({
                "status_pengajuan": new_pengajuan_status,
                "updated_at": datetime.now().isoformat(),
            }).eq("id_pengajuan", id_pengajuan).execute()

        print(f"[SYNC] Updated: transaksi={new_payment_status}, pengajuan={new_pengajuan_status}")

        return {
            "synced": True,
            "status_pembayaran": new_payment_status,
            "status_pengajuan": new_pengajuan_status,
        }

    return {
        "synced": False,
        "message": "Tidak ada perubahan status",
        "status_pembayaran": current_status,
    }
