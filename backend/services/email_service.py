import logging
from email.utils import parseaddr
import httpx
from core.config import get_settings

logger = logging.getLogger(__name__)


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def get_frontend_base_url() -> str:
    settings = get_settings()
    
    if settings.frontend_url:
        return settings.frontend_url.rstrip('/')

    app_env = settings.app_env.strip().lower()

    if app_env == "staging":
        return "https://staging-langkahlegal.vercel.app"
    elif app_env in {"production", "prod"}:
        return "https://langkahlegal.vercel.app"

    return "http://localhost:3000"


def _send_via_brevo(to_email: str, subject: str, body_html: str) -> None:
    settings = get_settings()

    if not settings.brevo_api_key:
        logger.warning("BREVO_API_KEY belum dikonfigurasi. Email tidak dikirim.")
        return

    sender_name, sender_email = parseaddr(settings.brevo_from_email)

    headers = {
        "api-key": settings.brevo_api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "sender": {
            "name": sender_name or "LangkahLegal",
            "email": sender_email or "langkahlegal@gmail.com"
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": body_html,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(BREVO_API_URL, headers=headers, json=payload)

        if response.status_code in (200, 201, 202):
            resp_data = response.json()
            logger.info(f"Email terkirim ke {to_email} (messageId={resp_data.get('messageId', '?')})")
        else:
            logger.error(
                f"Gagal kirim email ke {to_email} via Brevo: "
                f"status={response.status_code}, body={response.text}"
            )
    except httpx.TimeoutException:
        logger.error(f"Timeout saat kirim email ke {to_email} via Brevo")
    except Exception as e:
        logger.error(f"Error saat kirim email ke {to_email} via Brevo: {e}")


def send_recovery_email(to_email: str, recovery_link: str) -> None:
    subject = "Reset Password - LangkahLegal"
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Reset Password Anda</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mereset password akun LangkahLegal Anda. Jika Anda merasa tidak meminta ini, abaikan saja email ini.</p>
        <p>Untuk mereset password Anda, silakan klik tombol di bawah ini:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{recovery_link}" style="background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Atau copy-paste tautan berikut ke browser Anda:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">{recovery_link}</p>
        <br/>
        <p>Terima kasih,<br/>Tim LangkahLegal</p>
      </body>
    </html>
    """

    _send_via_brevo(to_email, subject, body_html)


def send_notification_email(to_email: str, subject: str, message: str) -> None:
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Pemberitahuan - LangkahLegal</h2>
        <p>Halo,</p>
        <p>{message}</p>
        <br/>
        <p>Terima kasih,<br/>Tim LangkahLegal</p>
      </body>
    </html>
    """

    _send_via_brevo(to_email, subject, body_html)
