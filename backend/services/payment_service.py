import logging
import math
import time
from datetime import datetime

import midtransclient
from supabase import Client

from core.config import Settings
from core.constants import Role, StatusPembayaran, StatusPengajuan
from core.exceptions import AppError, BadRequestError, ForbiddenError, InternalError, NotFoundError
from schemas.payments import CreateTransactionRequest
from helpers.access import get_konsultan_id, require_role
from repositories import (
    consultant_repository,
    consultation_repository,
    payment_repository,
    user_repository,
)
from services.email_service import get_frontend_base_url, send_notification_email

logger = logging.getLogger(__name__)

PAYABLE_STATUSES = [
    StatusPengajuan.MENUNGGU_PEMBAYARAN,
    StatusPengajuan.PEMBAYARAN_GAGAL,
    StatusPengajuan.KEDALUWARSA,
    StatusPengajuan.DIBATALKAN,
]
FINAL_STATUSES = (StatusPembayaran.SETTLEMENT, StatusPembayaran.CANCEL, StatusPembayaran.REFUND)


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


def _existing_snap_response(tx: dict) -> dict:
    return {
        "snap_token": tx["snap_token"],
        "redirect_url": tx.get("snap_redirect_url", ""),
        "order_id": tx["order_id"],
    }


def _calculate_quantity(pengajuan: dict) -> int:
    jam_mulai_str = str(pengajuan.get("jam_mulai", ""))
    jam_selesai_str = str(pengajuan.get("jam_selesai", ""))

    quantity = 1
    if jam_mulai_str and jam_selesai_str:
        try:
            jam_mulai_parts = jam_mulai_str.split(":")
            jam_selesai_parts = jam_selesai_str.split(":")

            start_h, start_m = int(jam_mulai_parts[0]), int(jam_mulai_parts[1])
            end_h, end_m = int(jam_selesai_parts[0]), int(jam_selesai_parts[1])

            start_total = start_h * 60 + start_m
            end_total = end_h * 60 + end_m

            diff = end_total - start_total
            if diff < 0:
                diff += 24 * 60

            calc_quantity = math.ceil(diff / 30.0)
            if calc_quantity > 0:
                quantity = calc_quantity
        except Exception as e:
            logger.warning(f"Failed to calculate quantity: {e}")
    return quantity


def _send_settlement_emails(
    db: Client, tx: dict, id_pengajuan: int, order_id: str, payment_type: str
) -> None:
    pengajuan = consultation_repository.get_by_id_strict(
        db, id_pengajuan, "id_user, id_konsultan, link_zoom"
    )
    if not pengajuan:
        return

    client = user_repository.get_by_id_strict(db, pengajuan["id_user"], "email, nama")
    if client:
        client_email = client["email"]
        client_nama = client["nama"]
        zoom_link = pengajuan.get("link_zoom") or "Belum ditentukan"
        subject = "Receipt: Pembayaran Konsultasi Berhasil"

        gross_amount = tx.get("gross_amount", 0)
        formatted_amount = f"Rp {int(gross_amount):,}".replace(",", ".")

        message = f"""Halo {client_nama},

Terima kasih! Pembayaran Anda untuk pengajuan (ID: {id_pengajuan}) telah berhasil dikonfirmasi.

====================================
BUKTI PEMBAYARAN (RECEIPT)
====================================
Order ID         : {order_id}
Nominal          : {formatted_amount}
Metode Pembayaran: {payment_type}
Waktu Bayar      : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
====================================

Link Zoom Anda: {zoom_link}
(Mohon cek website secara berkala jika link Zoom masih belum ditentukan oleh konsultan).

Salam,
LangkahLegal
"""
        send_notification_email(client_email, subject, message)

    konsultan = consultant_repository.get_by_id_strict(
        db, pengajuan["id_konsultan"], "id_user, nama_lengkap"
    )
    if konsultan:
        kons_user = user_repository.get_by_id_strict(db, konsultan["id_user"], "email")
        if kons_user:
            kons_email = kons_user["email"]
            kons_nama = konsultan["nama_lengkap"]
            kons_subject = "Klien Telah Membayar - Segera Isi Link Zoom"
            frontend_base_url = get_frontend_base_url()
            kons_message = f"""Halo {kons_nama},

Klien telah berhasil menyelesaikan pembayaran untuk pengajuan konsultasi (ID: {id_pengajuan}).
Status pengajuan kini menjadi 'Terjadwal'.

Langkah selanjutnya:
Mohon segera cek detail pengajuan dan masukkan tautan (Link) Zoom untuk konsultasi ini melalui aplikasi LangkahLegal.
Tautan untuk mengelola pengajuan:
{frontend_base_url}/consultation/{id_pengajuan}

Terima kasih atas kerja samanya.
"""
            send_notification_email(kons_email, kons_subject, kons_message)


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
    existing_tx = payment_repository.list_by_pengajuan_and_status(
        db, payload.id_pengajuan, StatusPembayaran.PENDING
    )
    if existing_tx:
        tx = existing_tx[0]
        api_client = _get_core_api_client(settings)
        try:
            status_response = api_client.transactions.status(tx["order_id"])
            tx_status = status_response.get("transaction_status")

            if tx_status in ("cancel", "deny", "expire"):
                payment_repository.update_by_order_id(db, tx["order_id"], {
                    "status_pembayaran": tx_status,
                    "updated_at": datetime.now().isoformat()
                })
                logger.info(f"Transaksi sebelumnya ternyata {tx_status}, membuat token baru...")
            else:
                if tx.get("snap_token"):
                    return _existing_snap_response(tx)
        except Exception as e:
            if "404" in str(e):
                if tx.get("snap_token"):
                    return _existing_snap_response(tx)
            else:
                logger.warning(f"Failed to check status for existing tx {tx['order_id']}: {e}")
    konsultan_data = pengajuan.get("konsultan") or {}
    tarif = konsultan_data.get("tarif_per_sesi")

    if not tarif or float(tarif) <= 0:
        raise BadRequestError("Tarif konsultan belum diatur")

    quantity = _calculate_quantity(pengajuan)

    gross_amount = int(float(tarif)) * quantity
    komisi_platform = int(gross_amount * 0.10)
    nominal_konsultan = gross_amount - komisi_platform

    order_id = f"LL-{payload.id_pengajuan}-{int(time.time())}"

    user_data = pengajuan.get("users") or {}
    customer_details = {
        "first_name": user_data.get("nama", "Client"),
        "email": user_data.get("email", "client@langkahlegal.com"),
    }

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
        logger.error(f"Midtrans Snap create_transaction failed: {e}")
        raise AppError(f"Gagal membuat transaksi pembayaran: {str(e)}", status_code=502)

    snap_token = snap_response.get("token", "")
    redirect_url = snap_response.get("redirect_url", "")

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

    new_payment_status = None
    new_pengajuan_status = None

    if transaction_status == "capture":
        if fraud_status == "accept":
            new_payment_status = StatusPembayaran.SETTLEMENT
            new_pengajuan_status = StatusPengajuan.TERJADWAL
        elif fraud_status == "challenge":
            new_payment_status = StatusPembayaran.PENDING
    elif transaction_status == "settlement":
        new_payment_status = StatusPembayaran.SETTLEMENT
        new_pengajuan_status = StatusPengajuan.TERJADWAL
    elif transaction_status in ("cancel", "deny"):
        new_payment_status = StatusPembayaran.CANCEL
        new_pengajuan_status = StatusPengajuan.DIBATALKAN
    elif transaction_status == "expire":
        new_payment_status = StatusPembayaran.EXPIRE
        new_pengajuan_status = StatusPengajuan.KEDALUWARSA
    elif transaction_status == "pending":
        new_payment_status = StatusPembayaran.PENDING
    elif transaction_status == "refund":
        new_payment_status = StatusPembayaran.REFUND
        new_pengajuan_status = StatusPengajuan.DIBATALKAN

    if new_payment_status:
        update_data = {
            "status_pembayaran": new_payment_status,
            "metode_pembayaran": payment_type,
            "updated_at": datetime.now().isoformat(),
        }

        if new_payment_status == StatusPembayaran.SETTLEMENT:
            update_data["waktu_bayar"] = datetime.now().isoformat()

        payment_repository.update_by_order_id(db, order_id, update_data)
        logger.info(f"[MIDTRANS WEBHOOK] Transaksi {order_id} diupdate ke {new_payment_status}")

    if new_pengajuan_status:
        consultation_repository.update(db, id_pengajuan, {
            "status_pengajuan": new_pengajuan_status,
            "updated_at": datetime.now().isoformat(),
        })
        logger.info(f"[MIDTRANS WEBHOOK] Pengajuan {id_pengajuan} diupdate ke {new_pengajuan_status}")

    if new_payment_status == StatusPembayaran.SETTLEMENT:
        try:
            _send_settlement_emails(db, tx, id_pengajuan, order_id, payment_type)
        except Exception as e:
            logger.error(f"Gagal kirim email webhook settlement: {e}")

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

    new_payment_status = None
    new_pengajuan_status = None

    if transaction_status == "capture":
        if fraud_status == "accept":
            new_payment_status = StatusPembayaran.SETTLEMENT
            new_pengajuan_status = StatusPengajuan.TERJADWAL
    elif transaction_status == "settlement":
        new_payment_status = StatusPembayaran.SETTLEMENT
        new_pengajuan_status = StatusPengajuan.TERJADWAL
    elif transaction_status in ("cancel", "deny"):
        new_payment_status = StatusPembayaran.CANCEL
        new_pengajuan_status = StatusPengajuan.DIBATALKAN
    elif transaction_status == "expire":
        new_payment_status = StatusPembayaran.EXPIRE
        new_pengajuan_status = StatusPengajuan.KEDALUWARSA
    elif transaction_status == "pending":
        new_payment_status = StatusPembayaran.PENDING

    if new_payment_status and new_payment_status != current_status:
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

        logger.info(f"[SYNC] Updated: transaksi={new_payment_status}, pengajuan={new_pengajuan_status}")

        if new_payment_status == StatusPembayaran.SETTLEMENT:
            try:
                _send_settlement_emails(db, tx, id_pengajuan, order_id, payment_type)
            except Exception as e:
                logger.error(f"Gagal kirim email sync settlement: {e}")

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
