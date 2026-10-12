from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from config import Settings, get_settings
from database import get_supabase_client
from dependencies import get_current_user
from schemas.payments import CreateTransactionRequest
from services import payment_service

router = APIRouter()


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
    return payment_service.create_transaction(db, current_user, settings, payload)

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
    try:
        notification_json = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    return payment_service.handle_notification(db, settings, notification_json)


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
    return payment_service.get_payment_status(db, current_user, id_pengajuan)


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
    return payment_service.sync_payment_status(db, current_user, settings, id_pengajuan)
