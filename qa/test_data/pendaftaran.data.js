const VALID = { name: "Budi Santoso", email: "budi.baru@example.com", password: "Rahasia123!" };

/** Isian formulir pendaftaran per kasus uji. */
export const SIGNUP_CASES = {
  "data yang valid": VALID,
  "nama beraksara non-Latin dan emoji": { ...VALID, name: "Ñandú 测试 🚀" },
  "kata sandi yang terlalu pendek": { ...VALID, password: "123" },
  "nama yang kosong": { ...VALID, name: "" },
};

/** Nama peran di layar dan nilai yang dikirim ke backend. */
export const SIGNUP_ROLES = {
  klien: { role: "client", formTitle: "Daftar sebagai Client" },
  konsultan: { role: "konsultan", formTitle: "Daftar sebagai Konsultan" },
};
