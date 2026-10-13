export const RECOVERY_EMAIL = "budi@example.com";

export const EXPIRED_RESET_LINK = { token: "000000", email: "sit.klien@example.com" };

export const NEW_PASSWORD = "PasswordBaru1!";

const TOO_SHORT = { label: "terlalu pendek", password: "123", confirmation: "123", message: "Password minimal 6 karakter." };

const MISMATCH = {
  label: "tidak cocok dengan konfirmasinya",
  password: "Rahasia123",
  confirmation: "Rahasia124",
  message: "Password dan konfirmasi password tidak cocok.",
};

const EMPTY = { label: "kosong", password: "", confirmation: "", message: "Semua kolom wajib diisi." };

/** Kata sandi yang harus ditolak tiap formulir, beserta pesan yang diharapkan. */
export const INVALID_PASSWORDS = {
  reset: [EMPTY, MISMATCH, { ...TOO_SHORT, password: "12345", confirmation: "12345" }],
  create: [TOO_SHORT, MISMATCH],
};
