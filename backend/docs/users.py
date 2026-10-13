GET_SETTINGS_INFO = {
    "summary": "Ambil data settings dasar user login",
    "description": "Mengembalikan data ringkas untuk halaman settings: nama, email, dan foto_profil.",
}

GET_FULL_PROFILE = {
    "summary": "Ambil profile lengkap user login",
    "description": """
Mengembalikan profile lengkap berdasarkan role user.

- Jika role `client`: mengembalikan profile dasar dari tabel users.
- Jika role `konsultan`: mengembalikan gabungan data users + data profesional darai tabel konsultan,
  termasuk field `portofolio`.
""",
}

UPDATE_PROFILE = {
    "summary": "Update profile user / profile profesional konsultan",
    "description": """
Endpoint update profile dalam satu pintu.

Mendukung:
1. `application/json` untuk update field teks biasa.
2. `multipart/form-data` untuk update dengan upload file portofolio.

Khusus konsultan:
- Upload file portofolio via field `portofolio_file` (PDF only).
- Hapus portofolio dengan mengirim field `portofolio` sebagai string kosong.

Catatan frontend:
- Untuk upload file, jangan set header Content-Type manual.
- Frontend cukup kirim `FormData` lalu browser otomatis menambahkan boundary multipart.
""",
}
