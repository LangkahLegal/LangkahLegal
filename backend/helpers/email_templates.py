from datetime import datetime


def new_request(konsultan_nama: str, frontend_base_url: str, id_pengajuan: int) -> tuple[str, str]:
    subject = "Pengajuan Konsultasi Baru"
    message = f"""Halo {konsultan_nama},

Anda memiliki pengajuan konsultasi baru yang menunggu persetujuan Anda.

Silakan tinjau detail pengajuan dan tentukan tindakan Anda melalui tautan berikut:
{frontend_base_url}/request/{id_pengajuan}

Terima kasih.
"""
    return subject, message


def request_rejected(client_nama: str, id_pengajuan: int) -> tuple[str, str]:
    subject = "Pengajuan Konsultasi Ditolak"
    message = f"Halo {client_nama}, mohon maaf, pengajuan konsultasi Anda (ID: {id_pengajuan}) telah ditolak oleh konsultan."
    return subject, message


def awaiting_payment(client_nama: str, frontend_base_url: str, id_pengajuan: int) -> tuple[str, str]:
    subject = "Jadwal Konsultasi Ditetapkan - Menunggu Pembayaran"
    message = f"""Halo {client_nama},

Kabar baik! Pengajuan konsultasi Anda (ID: {id_pengajuan}) telah dikonfirmasi oleh konsultan.

Silakan lanjutkan ke tahap pembayaran untuk mengamankan slot jadwal Anda. Anda dapat melakukan pembayaran melalui tautan berikut:
{frontend_base_url}/payment/{id_pengajuan}

(Atau Anda dapat langsung mengecek menu Dashboard di aplikasi LangkahLegal).

Terima kasih.
"""
    return subject, message


def schedule_assigned(client_nama: str, frontend_base_url: str, id_pengajuan: int) -> tuple[str, str]:
    subject = "Jadwal Konsultasi Ditetapkan - Menunggu Pembayaran"
    message = f"""Halo {client_nama},

Jadwal konsultasi Anda telah dikonfirmasi dan ditetapkan oleh konsultan (ID Pengajuan: {id_pengajuan}).

Silakan lanjutkan ke tahap pembayaran untuk mengamankan slot jadwal Anda. Anda dapat melakukan pembayaran melalui tautan berikut:
{frontend_base_url}/payment/{id_pengajuan}

(Atau Anda dapat langsung mengecek menu Dashboard di aplikasi LangkahLegal).

Terima kasih.
"""
    return subject, message


def zoom_link_available(client_nama: str, frontend_base_url: str, id_pengajuan: int) -> tuple[str, str]:
    subject = "Link Zoom Konsultasi Tersedia"
    message = f"""Halo {client_nama},

Konsultan telah membagikan link Zoom untuk sesi konsultasi Anda.
Silakan cek detail dan akses link tersebut melalui tautan berikut:
{frontend_base_url}/consultation/{id_pengajuan}

Terima kasih.
"""
    return subject, message


def case_claimed(
    client_nama: str,
    kons_nama: str,
    frontend_base_url: str,
    id_bursa: int,
    id_pengajuan: int,
) -> tuple[str, str]:
    subject = "Kabar Baik! Kasus Anda di Bursa Telah Diambil"
    message = f"""Halo {client_nama},

Kasus hukum yang Anda posting di bursa (ID Bursa: {id_bursa}) telah diambil oleh {kons_nama}.

Sebuah pengajuan konsultasi telah dibuat secara otomatis untuk Anda (ID Pengajuan: {id_pengajuan}).
Konsultan akan segera mengatur jadwal untuk sesi Anda. Silakan pantau halaman Dashboard atau halaman Konsultasi di aplikasi LangkahLegal.

Tautan untuk memantau status pengajuan:
{frontend_base_url}/consultation/{id_pengajuan}

Terima kasih.
"""
    return subject, message


def payment_receipt(
    client_nama: str,
    id_pengajuan: int,
    order_id: str,
    gross_amount,
    payment_type: str,
    zoom_link: str,
) -> tuple[str, str]:
    subject = "Receipt: Pembayaran Konsultasi Berhasil"
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
    return subject, message


def client_paid(kons_nama: str, frontend_base_url: str, id_pengajuan: int) -> tuple[str, str]:
    subject = "Klien Telah Membayar - Segera Isi Link Zoom"
    message = f"""Halo {kons_nama},

Klien telah berhasil menyelesaikan pembayaran untuk pengajuan konsultasi (ID: {id_pengajuan}).
Status pengajuan kini menjadi 'Terjadwal'.

Langkah selanjutnya:
Mohon segera cek detail pengajuan dan masukkan tautan (Link) Zoom untuk konsultasi ini melalui aplikasi LangkahLegal.
Tautan untuk mengelola pengajuan:
{frontend_base_url}/consultation/{id_pengajuan}

Terima kasih atas kerja samanya.
"""
    return subject, message
