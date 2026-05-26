import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import get_settings

logger = logging.getLogger(__name__)

def send_recovery_email(to_email: str, recovery_link: str) -> None:
    """
    Mengirimkan email Lupa Password secara native menggunakan SMTP backend.
    """
    settings = get_settings()
    
    if not settings.smtp_username or not settings.smtp_password:
        logger.warning("SMTP username atau password tidak dikonfigurasi. Email gagal dikirim.")
        return

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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email

    msg.attach(MIMEText(body_html, "html"))

    try:
        if settings.smtp_port == 465:
            # SSL
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port)
        else:
            # TLS
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
            server.starttls()
            
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Berhasil mengirim email reset password ke {to_email}")
    except Exception as e:
        logger.error(f"Gagal mengirim email SMTP: {str(e)}")
        raise e
