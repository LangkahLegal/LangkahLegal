import functools
import logging

from supabase import Client

from helpers import email_templates
from repositories import consultant_repository, consultation_repository, user_repository
from services.email_service import get_frontend_base_url, send_notification_email

logger = logging.getLogger(__name__)


def _best_effort(label: str):
    """Notifikasi tidak boleh menggagalkan request utama: error hanya dicatat."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Gagal kirim email {label}: {e}")

        return wrapper

    return decorator


def _send(to_email: str, template: tuple[str, str]) -> None:
    subject, message = template
    send_notification_email(to_email, subject, message)


@_best_effort("pengajuan baru")
def consultant_new_request(db: Client, id_konsultan: int, id_pengajuan: int) -> None:
    konsultan = consultant_repository.get_by_id_strict(db, id_konsultan, "id_user, nama_lengkap")
    if not konsultan:
        return

    user = user_repository.get_by_id_strict(db, konsultan["id_user"], "email")
    if user:
        _send(
            user["email"],
            email_templates.new_request(konsultan["nama_lengkap"], get_frontend_base_url(), id_pengajuan),
        )


@_best_effort("di update_status (ditolak)")
def client_request_rejected(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    client = user_repository.get_by_id_strict(db, data_pengajuan["id_user"], "email, nama")
    if client:
        _send(client["email"], email_templates.request_rejected(client["nama"], id_pengajuan))


@_best_effort("di update_status (menunggu_pembayaran)")
def client_awaiting_payment(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    client = user_repository.get_by_id_strict(db, data_pengajuan["id_user"], "email, nama")
    if client:
        _send(
            client["email"],
            email_templates.awaiting_payment(client["nama"], get_frontend_base_url(), id_pengajuan),
        )


@_best_effort("di assign-schedule")
def client_schedule_assigned(db: Client, data_pengajuan: dict, id_pengajuan: int) -> None:
    client = user_repository.get_by_id_strict(db, data_pengajuan["id_user"], "email, nama")
    if client:
        _send(
            client["email"],
            email_templates.schedule_assigned(client["nama"], get_frontend_base_url(), id_pengajuan),
        )


@_best_effort("di zoom-link")
def client_zoom_link(db: Client, id_pengajuan: int) -> None:
    pengajuan = consultation_repository.get_by_id_strict(db, id_pengajuan, "id_user")
    if not pengajuan:
        return

    client = user_repository.get_by_id_strict(db, pengajuan["id_user"], "email, nama")
    if client:
        _send(
            client["email"],
            email_templates.zoom_link_available(client["nama"], get_frontend_base_url(), id_pengajuan),
        )


@_best_effort("bursa diklaim")
def client_case_claimed(
    db: Client, kasus_data: dict, id_konsultan: int, id_bursa: int, pengajuan: dict
) -> None:
    id_pengajuan = pengajuan["id_pengajuan"]
    client = user_repository.get_by_id_strict(db, kasus_data["id_user"], "email, nama")
    if not client:
        return

    frontend_base_url = get_frontend_base_url()
    konsultan = consultant_repository.get_by_id_strict(db, id_konsultan, "nama_lengkap")
    kons_nama = konsultan["nama_lengkap"] if konsultan else "Seorang konsultan"

    _send(
        client["email"],
        email_templates.case_claimed(client["nama"], kons_nama, frontend_base_url, id_bursa, id_pengajuan),
    )


@_best_effort("settlement")
def payment_settled(db: Client, tx: dict, id_pengajuan: int, order_id: str, payment_type: str) -> None:
    pengajuan = consultation_repository.get_by_id_strict(
        db, id_pengajuan, "id_user, id_konsultan, link_zoom"
    )
    if not pengajuan:
        return

    client = user_repository.get_by_id_strict(db, pengajuan["id_user"], "email, nama")
    if client:
        _send(
            client["email"],
            email_templates.payment_receipt(
                client["nama"],
                id_pengajuan,
                order_id,
                tx.get("gross_amount", 0),
                payment_type,
                pengajuan.get("link_zoom") or "Belum ditentukan",
            ),
        )

    konsultan = consultant_repository.get_by_id_strict(
        db, pengajuan["id_konsultan"], "id_user, nama_lengkap"
    )
    if not konsultan:
        return

    kons_user = user_repository.get_by_id_strict(db, konsultan["id_user"], "email")
    if kons_user:
        _send(
            kons_user["email"],
            email_templates.client_paid(konsultan["nama_lengkap"], get_frontend_base_url(), id_pengajuan),
        )
