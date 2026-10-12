export const WRONG_PASSWORD = "salah123";

export const SAMPLE_PASSWORD = "Rahasia123!";

export const SQL_INJECTION_PASSWORD = "'; DROP TABLE users; --";

export const XSS_MESSAGE = '<img src=x onerror=alert("xss")>';

/** Email yang ditolak peramban sebelum formulir dikirim, beserta tanda validasinya. */
export const INVALID_EMAILS = {
  kosong: { email: "", validity: "valueMissing" },
  "salah format": { email: "bukan-email", validity: "typeMismatch" },
};

export const LOGIN_LINKS = {
  "lupa kata sandi": "forgotPasswordLink",
  daftar: "signUpLink",
};
