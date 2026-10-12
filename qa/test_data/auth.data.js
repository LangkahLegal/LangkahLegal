/** Token berbentuk JWT yang pasti ditolak backend. */
export const INVALID_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzaXQifQ.kedaluwarsa";

export const INVALID_REFRESH_TOKEN = "token-pembaruan-tidak-berlaku";

/** Pengguna sekali pakai yang dibuat lalu dihapus oleh satu skenario. */
export const TEMP_USERS = {
  emailPrefix: "sit.sementara",
  emailDomain: "example.com",
  signupName: "SIT Pendaftar",
  recoveryName: "SIT Reset",
  clientName: "SIT Klien Sementara",
};
