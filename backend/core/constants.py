class Role:
    CLIENT = "client"
    KONSULTAN = "konsultan"
    ADMIN = "admin"


class StatusPengajuan:
    PENDING = "pending"
    MENUNGGU_PEMBAYARAN = "menunggu_pembayaran"
    TERJADWAL = "terjadwal"
    SELESAI = "selesai"
    DIBATALKAN = "dibatalkan"
    DITOLAK = "ditolak"
    KEDALUWARSA = "kedaluwarsa"
    PEMBAYARAN_GAGAL = "pembayaran_gagal"

    ALL = (
        PENDING,
        MENUNGGU_PEMBAYARAN,
        TERJADWAL,
        SELESAI,
        DIBATALKAN,
        DITOLAK,
        KEDALUWARSA,
        PEMBAYARAN_GAGAL,
    )


class StatusPembayaran:
    PENDING = "pending"
    SETTLEMENT = "settlement"
    CANCEL = "cancel"
    EXPIRE = "expire"
    REFUND = "refund"


class StatusBursa:
    OPEN = "open"
    CLOSED = "closed"


class StatusVerifikasi:
    PENDING = "pending"
    TERVERIFIKASI = "terverifikasi"
    DITOLAK = "ditolak"
