API_DESCRIPTION = """
API backend untuk platform konsultasi hukum LangkahLegal.

Panduan singkat untuk frontend:
- Semua endpoint bisnis berada di prefix `/api/v1`.
- Endpoint yang membutuhkan login menggunakan header: `Authorization: Bearer <access_token>`.
- Gunakan endpoint auth untuk mendapatkan access token.
- Endpoint upload file (portofolio dan dokumen pendukung) wajib dikirim sebagai `multipart/form-data`.

Ringkasan modul:
- `Auth`: Signup/login/OTP/OAuth/session.
- `Direktori Konsultan`: Katalog konsultan, detail konsultan, dan manajemen jadwal.
- `Konsultasi`: Pengajuan konsultasi, response konsultan, status, dan rating.
- `Users / Profile`: Profile user dan profile profesional konsultan.
- `Bursa Kasus`: Posting kasus anonim dan sistem klaim langsung oleh konsultan.

Catatan integrasi frontend:
- Jika endpoint menerima file, jangan set header `Content-Type` manual; biarkan browser/client mengisi boundary multipart otomatis.
- Field timestamp pada pengajuan konsultasi menggunakan format ISO 8601.
"""

HEALTH_CHECK = {
    "description": """
Mengecek status server dan koneksi database.

Frontend dapat memanggil endpoint ini saat startup aplikasi untuk memastikan API siap dipakai.
""",
}
