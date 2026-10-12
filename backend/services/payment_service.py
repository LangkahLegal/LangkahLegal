import logging
import time
from datetime import datetime

import midtransclient
from supabase import Client

from core.config import Settings
from core.constants import Role, StatusPembayaran, StatusPengajuan
from core.exceptions import AppError, BadRequestError, ForbiddenError, InternalError, NotFoundError
from helpers.access import get_konsultan_id, require_role
from helpers.schedule import count_sessions
from repositories import consultation_repository, payment_repository
from schemas.payments import CreateTransactionRequest
from services import notification_service

logger = logging.getLogger(__name__)

PLATFORM_COMMISSION_RATE = 0.10

PAYABLE_STATUSES = [
    StatusPengajuan.MENUNGGU_PEMBAYARAN,
    StatusPengajuan.PEMBAYARAN_GAGAL,
    StatusPengajuan.KEDALUWARSA,
    StatusPengajuan.DIBATALKAN,
]
FINAL_STATUSES = (StatusPembayaran.SETTLEMENT, StatusPembayaran.CANCEL, StatusPembayaran.REFUND)

MIDTRANS_STALE_STATUSES = ("cancel", "deny", "expire")
MIDTRANS_STATUS_MAP = {
    "settlement": (StatusPembayaran.SETTLEMENT, StatusPengajuan.TERJADWAL),
    "cancel": (StatusPembayaran.CANCEL, StatusPengajuan.DIBATALKAN),
    "deny": (StatusPembayaran.CANCEL, StatusPengajuan.DIBATALKAN),
    "expire": (StatusPembayaran.EXPIRE, StatusPengajuan.KEDALUWARSA),
    "pending": (StatusPembayaran.PENDING, None),
    "refund": (StatusPembayaran.REFUND, StatusPengajuan.DIBATALKAN),
}


def _get_snap_client(settings: Settings) -> midtransclient.Snap:
    return midtransclient.Snap(
        is_production=settings.midtrans_is_production,
        server_key=settings.midtrans_server_key,
        client_key=settings.midtrans_client_key,
    )


def _get_core_api_client(settings: Settings) -> midtransclient.CoreApi:
    return midtransclient.CoreApi(
        is_production=settings.midtrans_is_production,
        server_key=settings.midtrans_server_key,
        client_key=settings.midtrans_client_key,
    )


def _map_midtrans_status(transaction_status: str, fraud_status: str) -> tuple[str | None, str | None]:
    if transaction_status == "capture":
        if fraud_status == "accept":
            return StatusPembayaran.SETTLEMENT, StatusPengajuan.TERJADWAL
        if fraud_status == "challenge":
            return StatusPembayaran.PENDING, None
        return None, None

    return MIDTRANS_STATUS_MAP.get(transaction_status, (None, None))


def _save_statuses(
    db: Client,
    order_id: str,
    id_pengajuan: int,
    payment_type: str,
    new_payment_status: str,
    new_pengajuan_status: str | None,
) -> None:
    update_data = {
        "status_pembayaran": new_payment_status,
        "metode_pembayaran": payment_type,
        "updated_at": datetime.now().isoformat(),
    }
    if new_payment_status == StatusPembayaran.SETTLEMENT:
        update_data["waktu_bayar"] = datetime.now().isoformat()

    payment_repository.update_by_order_id(db, order_id, update_data)

    if new_pengajuan_status:
        consultation_repository.update(db, id_pengajuan, {
            "status_pengajuan": new_pengajuan_status,
            "updated_at": datetime.now().isoformat(),
        })

    logger.info(
        f"Order {order_id}: transaksi={new_payment_status}, "
        f"pengajuan {id_pengajuan}={new_pengajuan_status}"
    )


def _existing_snap_response(tx: dict) -> dict:
    return {
        "snap_token": tx["snap_token"],
        "redirect_url": tx.get("snap_redirect_url", ""),
        "order_id": tx["order_id"],
    }


def _reuse_pending_transaction(db: Client, settings: Settings, id_pengajuan: int) -> dict | None:
    pending = payment_repository.list_by_pengajuan_and_status(db, id_pengajuan, StatusPembayaran.PENDING)
    if not pending:
        return None

    tx = pending[0]
    api_client = _get_core_api_client(settings)
    try:
        tx_status = api_client.transactions.status(tx["order_id"]).get("transaction_status")

        if tx_status in MIDTRANS_STALE_STATUSES:
            payment_repository.update_by_order_id(db, tx["order_id"], {
                "status_pembayaran": tx_status,
                "updated_at": datetime.now().isoformat()
            })
            logger.info(f"Transaksi sebelumnya ternyata {tx_status}, membuat token baru...")
            return None
    except Exception as e:
        if "404" not in str(e):
            logger.warning(f"Failed to check status for existing tx {tx['order_id']}: {e}")
            return None

    return _existing_snap_response(tx) if tx.get("snap_token") else None


def _calculate_amounts(pengajuan: dict) -> tuple[int, int, int]:
    tarif = (pengajuan.get("konsultan") or {}).get("tarif_per_sesi")

    if not tarif or float(tarif) <= 0:
        raise BadRequestError("Tarif konsultan belum diatur")

    quantity = count_sessions(str(pengajuan.get("jam_mulai", "")), str(pengajuan.get("jam_selesai", "")))

    gross_amount = int(float(tarif)) * quantity
    komisi_platform = int(gross_amount * PLATFORM_COMMISSION_RATE)
    return gross_amount, komisi_platform, gross_amount - komisi_platform


def _create_snap_transaction(
    settings: Settings, order_id: str, gross_amount: int, pengajuan: dict
) -> tuple[str, str]:
    user_data = pengajuan.get("users") or {}
    transaction_param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount,
        },
        "customer_details": {
            "first_name": user_data.get("nama", "Client"),
            "email": user_data.get("email", "client@langkahlegal.com"),
        },
        "expiry": {
            "unit": "hour",
            "duration": 1,
        },
    }

    snap = _get_snap_client(settings)
    try:
        snap_response = snap.create_transaction(transaction_param)
    except Exception as e:
        logger.error(f"Midtrans Snap create_transaction failed: {e}")
        raise AppError(f"Gagal membuat transaksi pembayaran: {str(e)}", status_code=502)

    return snap_response.get("token", ""), snap_response.get("redirect_url", "")


def create_transaction(
    db: Client,
    current_user: dict,
    settings: Settings,
    payload: CreateTransactionRequest,
) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang bisa melakukan pembayaran")

    try:
        pengajuan = consultation_repository.get_for_payment(
            db, payload.id_pengajuan, current_user["id_user"]
        )
    except Exception as e:
        logger.error(f"Gagal query pengajuan: {e}")
        raise InternalError("Gagal mengambil data pengajuan")

    if pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    if pengajuan["status_pengajuan"] not in PAYABLE_STATUSES:
        raise BadRequestError(
            f"Pengajuan tidak dalam status yang memerlukan pembayaran (status saat ini: {pengajuan['status_pengajuan']})"
        )

    existing = _reuse_pending_transaction(db, settings, payload.id_pengajuan)
    if existing:
        return existing

    gross_amount, komisi_platform, nominal_konsultan = _calculate_amounts(pengajuan)
    order_id = f"LL-{payload.id_pengajuan}-{int(time.time())}"
    snap_token, redirect_url = _create_snap_transaction(settings, order_id, gross_amount, pengajuan)

    try:
        payment_repository.insert(db, {
            "id_pengajuan": payload.id_pengajuan,
            "order_id": order_id,
            "gross_amount": gross_amount,
            "nominal_konsultan": nominal_konsultan,
            "komisi_platform": komisi_platform,
            "status_pembayaran": StatusPembayaran.PENDING,
            "snap_token": snap_token,
            "snap_redirect_url": redirect_url,
        })
    except Exception as e:
        logger.error(f"Gagal menyimpan transaksi ke DB: {e}")
        raise InternalError("Gagal menyimpan data transaksi")

    return {
        "snap_token": snap_token,
        "redirect_url": redirect_url,
        "order_id": order_id,
    }


def handle_notification(db: Client, settings: Settings, notification_json: dict) -> dict:
    logger.info(f"[MIDTRANS WEBHOOK] Received notification: {notification_json}")

    api_client = _get_core_api_client(settings)

    try:
        status_response = api_client.transactions.notification(notification_json)
    except Exception as e:
        logger.error(f"Midtrans notification verification failed: {e}")
        raise BadRequestError("Verifikasi notifikasi gagal")

    order_id = status_response.get("order_id", "")
    transaction_status = status_response.get("transaction_status", "")
    fraud_status = status_response.get("fraud_status", "")
    payment_type = status_response.get("payment_type", "")

    logger.info(f"[MIDTRANS WEBHOOK] Order: {order_id}, Status: {transaction_status}, Fraud: {fraud_status}")

    tx = payment_repository.get_by_order_id(db, order_id)

    if tx is None:
        logger.warning(f"Transaksi dengan order_id '{order_id}' tidak ditemukan di DB")
        return {"status": "ok", "message": "Order not found, ignored"}

    id_pengajuan = tx["id_pengajuan"]
    current_payment_status = tx.get("status_pembayaran", "")

    if current_payment_status in FINAL_STATUSES:
        logger.info(f"[MIDTRANS WEBHOOK] Transaksi {order_id} sudah final ({current_payment_status}), skip.")
        return {"status": "ok", "message": f"Already {current_payment_status}"}

    new_payment_status, new_pengajuan_status = _map_midtrans_status(transaction_status, fraud_status)

    if new_payment_status:
        _save_statuses(db, order_id, id_pengajuan, payment_type, new_payment_status, new_pengajuan_status)

    if new_payment_status == StatusPembayaran.SETTLEMENT:
        notification_service.payment_settled(db, tx, id_pengajuan, order_id, payment_type)

    return {"status": "ok"}


def get_payment_status(db: Client, current_user: dict, id_pengajuan: int) -> dict:
    try:
        pengajuan = consultation_repository.get_by_id(
            db, id_pengajuan, "id_pengajuan, id_user, id_konsultan"
        )
    except Exception as e:
        logger.error(f"Gagal query pengajuan: {e}")
        raise InternalError("Gagal mengambil data pengajuan")

    if pengajuan is None:
        raise NotFoundError("Pengajuan tidak ditemukan")

    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == Role.CLIENT and pengajuan["id_user"] != user_id:
        raise ForbiddenError("Akses ditolak")
    elif user_role == Role.KONSULTAN:
        id_kons = get_konsultan_id(db, user_id)
        if id_kons is None or id_kons != pengajuan["id_konsultan"]:
            raise ForbiddenError("Akses ditolak")

    tx = payment_repository.get_latest_by_pengajuan(db, id_pengajuan)

    if tx is None:
        return {"data": None, "message": "Belum ada transaksi pembayaran"}

    return {"data": tx}


def sync_payment_status(
    db: Client, current_user: dict, settings: Settings, id_pengajuan: int
) -> dict:
    require_role(current_user, Role.CLIENT, "Hanya klien yang bisa sinkronisasi pembayaran")

    tx = payment_repository.get_latest_by_pengajuan(db, id_pengajuan)

    if tx is None:
        raise NotFoundError("Transaksi tidak ditemukan")

    order_id = tx["order_id"]
    current_status = tx.get("status_pembayaran", "")

    if current_status in FINAL_STATUSES:
        return {
            "synced": False,
            "message": f"Status sudah final: {current_status}",
            "status_pembayaran": current_status,
        }

    api_client = _get_core_api_client(settings)

    try:
        midtrans_status = api_client.transactions.status(order_id)
    except Exception as e:
        logger.error(f"[SYNC] Gagal query Midtrans status for {order_id}: {e}")
        raise AppError(f"Gagal cek status ke Midtrans: {str(e)}", status_code=502)

    transaction_status = midtrans_status.get("transaction_status", "")
    fraud_status = midtrans_status.get("fraud_status", "")
    payment_type = midtrans_status.get("payment_type", "")

    logger.info(f"[SYNC] Order {order_id}: midtrans_status={transaction_status}, fraud={fraud_status}")

    new_payment_status, new_pengajuan_status = _map_midtrans_status(transaction_status, fraud_status)

    if not new_payment_status or new_payment_status == current_status:
        return {
            "synced": False,
            "message": "Tidak ada perubahan status",
            "status_pembayaran": current_status,
        }

    _save_statuses(db, order_id, id_pengajuan, payment_type, new_payment_status, new_pengajuan_status)

    if new_payment_status == StatusPembayaran.SETTLEMENT:
        notification_service.payment_settled(db, tx, id_pengajuan, order_id, payment_type)

    return {
        "synced": True,
        "status_pembayaran": new_payment_status,
        "status_pengajuan": new_pengajuan_status,
    }
