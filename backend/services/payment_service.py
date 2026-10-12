import math
import time
from datetime import datetime

import midtransclient
from supabase import Client

from config import Settings
from exceptions import AppError, BadRequestError, ForbiddenError, InternalError, NotFoundError
from schemas.payments import CreateTransactionRequest
from services.email_service import get_frontend_base_url, send_notification_email

PAYABLE_STATUSES = ["menunggu_pembayaran", "pembayaran_gagal", "kedaluwarsa", "dibatalkan"]
FINAL_STATUSES = ("settlement", "cancel", "refund")


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


def _existing_snap_response(tx: dict) -> dict:
    return {
        "snap_token": tx["snap_token"],
        "redirect_url": tx.get("snap_redirect_url", ""),
        "order_id": tx["order_id"],
    }


def _calculate_quantity(pengajuan: dict) -> int:
    """Jumlah blok 30 menit dari rentang jam konsultasi (minimal 1)."""
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
            print(f"[WARN] Failed to calculate quantity: {e}")
    return quantity


def _send_settlement_emails(
    db: Client, tx: dict, id_pengajuan: int, order_id: str, payment_type: str
) -> None:
    """Kirim receipt ke klien dan pemberitahuan ke konsultan setelah pembayaran settle."""
    pengajuan_res = db.table("pengajuan_konsultasi").select("id_user, id_konsultan, link_zoom").eq("id_pengajuan", id_pengajuan).single().execute()
    if not pengajuan_res.data:
        return

    client_res = db.table("users").select("email, nama").eq("id_user", pengajuan_res.data["id_user"]).single().execute()
    if client_res.data:
        client_email = client_res.data["email"]
        client_nama = client_res.data["nama"]
        zoom_link = pengajuan_res.data.get("link_zoom") or "Belum ditentukan"
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

    kons_res = db.table("konsultan").select("id_user, nama_lengkap").eq("id_konsultan", pengajuan_res.data["id_konsultan"]).single().execute()
    if kons_res.data:
        kons_user_res = db.table("users").select("email").eq("id_user", kons_res.data["id_user"]).single().execute()
        if kons_user_res.data:
            kons_email = kons_user_res.data["email"]
            kons_nama = kons_res.data["nama_lengkap"]
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
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang bisa melakukan pembayaran")

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
        raise InternalError("Gagal mengambil data pengajuan")

    if not pengajuan_res.data:
        raise NotFoundError("Pengajuan tidak ditemukan")

    pengajuan = pengajuan_res.data[0]

    if pengajuan["status_pengajuan"] not in PAYABLE_STATUSES:
        raise BadRequestError(
            f"Pengajuan tidak dalam status yang memerlukan pembayaran (status saat ini: {pengajuan['status_pengajuan']})"
        )
    existing_tx = (
        db.table("transaksi")
        .select("*")
        .eq("id_pengajuan", payload.id_pengajuan)
        .eq("status_pembayaran", "pending")
        .execute()
    )
    if existing_tx.data:
        tx = existing_tx.data[0]
        api_client = _get_core_api_client(settings)
        try:
            status_response = api_client.transactions.status(tx["order_id"])
            tx_status = status_response.get("transaction_status")

            if tx_status in ("cancel", "deny", "expire"):
                db.table("transaksi").update({
                    "status_pembayaran": tx_status,
                    "updated_at": datetime.now().isoformat()
                }).eq("order_id", tx["order_id"]).execute()
                print(f"[INFO] Transaksi sebelumnya ternyata {tx_status}, membuat token baru...")
            else:
                if tx.get("snap_token"):
                    return _existing_snap_response(tx)
        except Exception as e:
            if "404" in str(e):
                if tx.get("snap_token"):
                    return _existing_snap_response(tx)
            else:
                print(f"[WARN] Failed to check status for existing tx {tx['order_id']}: {e}")
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
        print(f"[ERROR] Midtrans Snap create_transaction failed: {e}")
        raise AppError(f"Gagal membuat transaksi pembayaran: {str(e)}", status_code=502)

    snap_token = snap_response.get("token", "")
    redirect_url = snap_response.get("redirect_url", "")

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
        raise InternalError("Gagal menyimpan data transaksi")

    return {
        "snap_token": snap_token,
        "redirect_url": redirect_url,
        "order_id": order_id,
    }


def handle_notification(db: Client, settings: Settings, notification_json: dict) -> dict:
    print(f"[MIDTRANS WEBHOOK] Received notification: {notification_json}")

    api_client = _get_core_api_client(settings)

    try:
        status_response = api_client.transactions.notification(notification_json)
    except Exception as e:
        print(f"[ERROR] Midtrans notification verification failed: {e}")
        raise BadRequestError("Verifikasi notifikasi gagal")

    order_id = status_response.get("order_id", "")
    transaction_status = status_response.get("transaction_status", "")
    fraud_status = status_response.get("fraud_status", "")
    payment_type = status_response.get("payment_type", "")

    print(f"[MIDTRANS WEBHOOK] Order: {order_id}, Status: {transaction_status}, Fraud: {fraud_status}")

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

    if current_payment_status in FINAL_STATUSES:
        print(f"[MIDTRANS WEBHOOK] Transaksi {order_id} sudah final ({current_payment_status}), skip.")
        return {"status": "ok", "message": f"Already {current_payment_status}"}

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

    if new_pengajuan_status:
        db.table("pengajuan_konsultasi").update({
            "status_pengajuan": new_pengajuan_status,
            "updated_at": datetime.now().isoformat(),
        }).eq("id_pengajuan", id_pengajuan).execute()
        print(f"[MIDTRANS WEBHOOK] Pengajuan {id_pengajuan} diupdate ke {new_pengajuan_status}")

    if new_payment_status == "settlement":
        try:
            _send_settlement_emails(db, tx, id_pengajuan, order_id, payment_type)
        except Exception as e:
            print(f"[EMAIL ERROR] Gagal kirim email webhook settlement: {e}")

    return {"status": "ok"}


def get_payment_status(db: Client, current_user: dict, id_pengajuan: int) -> dict:
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
        raise InternalError("Gagal mengambil data pengajuan")

    if not pengajuan_res.data:
        raise NotFoundError("Pengajuan tidak ditemukan")

    pengajuan = pengajuan_res.data[0]
    user_role = current_user.get("role")
    user_id = current_user.get("id_user")

    if user_role == "client" and pengajuan["id_user"] != user_id:
        raise ForbiddenError("Akses ditolak")
    elif user_role == "konsultan":
        kons_res = (
            db.table("konsultan")
            .select("id_konsultan")
            .eq("id_user", user_id)
            .limit(1)
            .execute()
        )
        if not kons_res.data or kons_res.data[0]["id_konsultan"] != pengajuan["id_konsultan"]:
            raise ForbiddenError("Akses ditolak")

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


def sync_payment_status(
    db: Client, current_user: dict, settings: Settings, id_pengajuan: int
) -> dict:
    if current_user.get("role") != "client":
        raise ForbiddenError("Hanya klien yang bisa sinkronisasi pembayaran")

    tx_res = (
        db.table("transaksi")
        .select("*")
        .eq("id_pengajuan", id_pengajuan)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not tx_res.data:
        raise NotFoundError("Transaksi tidak ditemukan")

    tx = tx_res.data[0]
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
        print(f"[SYNC] Gagal query Midtrans status for {order_id}: {e}")
        raise AppError(f"Gagal cek status ke Midtrans: {str(e)}", status_code=502)

    transaction_status = midtrans_status.get("transaction_status", "")
    fraud_status = midtrans_status.get("fraud_status", "")
    payment_type = midtrans_status.get("payment_type", "")

    print(f"[SYNC] Order {order_id}: midtrans_status={transaction_status}, fraud={fraud_status}")

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

        if new_payment_status == "settlement":
            try:
                _send_settlement_emails(db, tx, id_pengajuan, order_id, payment_type)
            except Exception as e:
                print(f"[EMAIL ERROR] Gagal kirim email sync settlement: {e}")

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
