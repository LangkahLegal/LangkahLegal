GET_ADMIN_STATS = {
    "description": """Ringkasan statistik platform untuk admin dashboard.

Returns:
- total_users: Jumlah seluruh user
- total_clients: Jumlah user dengan role client
- total_consultants: Jumlah konsultan terdaftar
- pending_verification: Konsultan yang menunggu verifikasi
- total_transactions: Jumlah transaksi yang settlement
- total_revenue: Total gross amount dari semua transaksi settlement
- total_commission: Total komisi platform (10%)""",
}

GET_CONSULTANTS_LIST = {
    "description": """List semua konsultan untuk verifikasi.

Query params:
- status_filter: 'pending' | 'terverifikasi' | None (semua)""",
}

GET_CONSULTANT_DETAIL = {
    "description": """Detail lengkap konsultan untuk review verifikasi.

Includes: profil user, spesialisasi, pengalaman, portofolio, rating, jadwal.""",
}

VERIFY_CONSULTANT = {
    "description": """Approve atau reject konsultan.

Payload:
- action: 'terverifikasi' atau 'ditolak'
- alasan: Alasan jika ditolak (opsional)""",
}
