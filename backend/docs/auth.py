SIGN_UP = {
    "summary": "Daftar akun baru",
    "description": "Mendaftarkan user baru menggunakan email/password.",
}

SEND_OTP_LOGIN = {
    "summary": "Kirim OTP login ke email",
    "description": "Mengirim OTP login ke email yang sudah terdaftar. Endpoint ini tidak membuat user baru.",
}

RESEND_SIGNUP_OTP = {
    "summary": "Kirim ulang OTP signup",
    "description": "Mengirim ulang OTP verifikasi email pada flow signup.",
}

VERIFY_OTP = {
    "summary": "Verifikasi OTP",
    "description": "Memverifikasi token OTP dan mengembalikan session/access token bila berhasil.",
}

LOGIN_WITH_PASSWORD = {
    "summary": "Login dengan email & password",
    "description": "Login standar berbasis password. Mengembalikan session lengkap (access token + refresh token).",
}

SIGN_IN_WITH_GOOGLE = {
    "summary": "Generate OAuth URL Google",
    "description": "Menghasilkan URL OAuth Google + PKCE verifier.",
}

EXCHANGE_CODE = {
    "summary": "Tukar OAuth Code dengan Session",
    "description": "Menukar code dari URL callback dengan session/access token.",
}

REFRESH_SESSION = {
    "summary": "Refresh access token",
    "description": "Menukar refresh token untuk mendapatkan session/access token baru.",
}

GET_PROFILE = {
    "summary": "Ambil profil user berdasarkan bearer token",
    "description": "Validasi access token ke Supabase lalu kembalikan profile user lokal.",
}

UPDATE_ROLE = {
    "summary": "Set role user setelah login",
    "description": "Menyimpan atau memperbarui role user.",
}

LOGOUT = {
    "summary": "Logout session user",
    "description": "Mencabut session/token aktif user pada Supabase Auth dan menghapus cookie.",
}

FORGOT_PASSWORD = {
    "summary": "Kirim tautan reset password",
    "description": "Mengirimkan tautan reset password ke email user.",
}

RESET_PASSWORD = {
    "summary": "Reset password user",
    "description": "Mengubah password user setelah berhasil memverifikasi tautan reset.",
}
