/**
 * F03–F11 — Autentikasi: Login, Google OAuth, Role, Signup, OTP, Lupa/Reset Password,
 * Create Password, OAuth Callback.
 */
import { test, expect, tc, knownDefect, expectNoCrash } from "../support/fixtures.js";
import { session, USERS } from "../support/mock-data.js";

const F_LOGIN = "F03 Login Email & Password";
const F_GOOGLE = "F04 Login Google (OAuth)";
const F_ROLE = "F05 Pemilihan Role";
const F_SIGNUP = "F06 Registrasi (Signup)";
const F_OTP = "F07 Verifikasi OTP Email";
const F_FORGOT = "F08 Lupa Password";
const F_RESET = "F09 Reset Password via Link";
const F_CREATE = "F10 Buat Password (akun OAuth)";
const F_CALLBACK = "F11 OAuth Callback";

/** Set sessionStorage sekali sebelum aplikasi dimuat. */
async function presetSessionStorage(page, entries) {
  await page.addInitScript((e) => {
    if (sessionStorage.getItem("__preset")) return;
    Object.entries(e).forEach(([k, v]) => sessionStorage.setItem(k, v));
    sessionStorage.setItem("__preset", "1");
  }, entries);
}

const login = (page) => ({
  email: page.getByTestId("login-email-input"),
  password: page.getByTestId("login-password-input"),
  submit: page.getByTestId("login-submit-btn"),
  error: page.getByTestId("login-error-msg"),
});

// ═══════════════════════════════════════════════════════════════ LOGIN
test.describe("Login @auth", () => {
  for (const [id, role, home] of [
    ["AUTH-001", "client", "/dashboard/client"],
    ["AUTH-002", "konsultan", "/dashboard/consultant"],
    ["AUTH-003", "admin", "/dashboard/admin"],
  ]) {
    test(...tc(id, `Login sukses sebagai ${role} diarahkan ke ${home}`, {
      feature: F_LOGIN, type: "E2E",
      input: `email=${USERS[role].email}, password=Rahasia123!`,
      expected: `POST /auth/login-password dengan body {email,password}, token tersimpan di localStorage, redirect ke ${home}`,
      tags: role === "client" ? ["@mobile", "@smoke"] : ["@smoke"],
    }), async ({ page, api }) => {
      if (role === "client") api.asClient();
      else if (role === "konsultan") api.asConsultant();
      else api.asAdmin();
      api.on("POST", "/auth/login-password", { json: { data: { session: session(role) } } });

      await page.goto("/auth/login");
      const f = login(page);
      await f.email.fill(USERS[role].email);
      await f.password.fill("Rahasia123!");
      await f.submit.click();

      await expect(page).toHaveURL(new RegExp(`${home}$`), { timeout: 15_000 });
      const req = await api.waitFor("POST", "/auth/login-password");
      expect(req.body).toEqual({ email: USERS[role].email, password: "Rahasia123!" });
      expect(await page.evaluate(() => localStorage.getItem("ll_token"))).toBe(`access-${role}-token`);
      expect(await page.evaluate(() => localStorage.getItem("ll_role"))).toBe(role);
    });
  }

  test(...tc("AUTH-004", "Login akun tanpa role diarahkan ke pemilihan role", {
    feature: F_LOGIN, type: "Edge Case",
    input: "Login valid, GET /auth/profile mengembalikan role=null",
    expected: "Redirect ke /auth/role",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/login-password", { json: { data: { session: session("client") } } });
    api.on("GET", "/auth/profile", { json: { data: { ...USERS.client, role: null } } });
    await page.goto("/auth/login");
    const f = login(page);
    await f.email.fill("baru@example.com");
    await f.password.fill("Rahasia123!");
    await f.submit.click();
    await expect(page).toHaveURL(/\/auth\/role$/);
  });

  test(...tc("AUTH-005", "Password salah menampilkan pesan error dari backend", {
    feature: F_LOGIN, type: "Negative",
    input: "email valid, password=salah123 → backend 400 'Invalid login credentials'",
    expected: "Pesan 'Invalid login credentials' tampil, tetap di /auth/login, token tidak tersimpan",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("POST", "/auth/login-password", { status: 400, json: { detail: "Invalid login credentials" } });
    await page.goto("/auth/login");
    const f = login(page);
    await f.email.fill("budi@example.com");
    await f.password.fill("salah123");
    await f.submit.click();
    await expect(f.error).toHaveText("Invalid login credentials");
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(await page.evaluate(() => localStorage.getItem("ll_token"))).toBeNull();
    await expect(f.submit).toBeEnabled();
  });

  test(...tc("AUTH-006", "Password kosong divalidasi di sisi klien tanpa memanggil API", {
    feature: F_LOGIN, type: "Negative",
    input: "email=budi@example.com, password kosong",
    expected: "Pesan 'Password wajib diisi.' tampil dan tidak ada request ke /auth/login-password",
  }), async ({ page, api }) => {
    await page.goto("/auth/login");
    const f = login(page);
    await f.email.fill("budi@example.com");
    await f.submit.click();
    await expect(f.error).toHaveText("Password wajib diisi.");
    expect(api.calls("POST", "/auth/login-password")).toHaveLength(0);
  });

  test(...tc("AUTH-007", "Email kosong / format salah diblokir validasi HTML5", {
    feature: F_LOGIN, type: "Negative",
    input: "(a) email kosong, (b) email='bukan-email', password=Rahasia123!",
    expected: "Form tidak tersubmit (validity invalid), tidak ada request ke API",
  }), async ({ page, api }) => {
    await page.goto("/auth/login");
    const f = login(page);
    await f.password.fill("Rahasia123!");
    await f.submit.click();
    expect(await f.email.evaluate((el) => el.validity.valueMissing)).toBe(true);
    await f.email.fill("bukan-email");
    await f.submit.click();
    expect(await f.email.evaluate((el) => el.validity.typeMismatch)).toBe(true);
    expect(api.calls("POST", "/auth/login-password")).toHaveLength(0);
  });

  test(...tc("AUTH-008", "Server error 500 / koneksi putus ditangani dengan pesan error", {
    feature: F_LOGIN, type: "Negative",
    input: "(a) backend 500 tanpa detail, (b) request network failure",
    expected: "Pesan error tampil, tombol 'Masuk' aktif kembali, halaman tidak crash",
  }), async ({ page, api }) => {
    let n = 0;
    api.on("POST", "/auth/login-password", () => (++n === 1 ? { status: 500, json: {} } : { abort: true }));
    await page.goto("/auth/login");
    const f = login(page);
    await f.email.fill("budi@example.com");
    await f.password.fill("Rahasia123!");
    await f.submit.click();
    await expect(f.error).toBeVisible();
    await expect(f.submit).toHaveText("Masuk");
    await f.submit.click();
    await expect(f.error).toContainText(/Network Error|Gagal/i);
    await expectNoCrash(page);
  });

  test(...tc("AUTH-009", "Tombol login dinonaktifkan selama proses (anti double-submit)", {
    feature: F_LOGIN, type: "Edge Case",
    input: "Klik 'Masuk' lalu klik lagi saat request masih berjalan (delay 1.5s)",
    expected: "Label 'Memverifikasi...', tombol disabled, hanya 1 request terkirim",
  }), async ({ page, api }) => {
    api.asClient();
    api.on("POST", "/auth/login-password", { delay: 1500, json: { data: { session: session("client") } } });
    await page.goto("/auth/login");
    const f = login(page);
    await f.email.fill("budi@example.com");
    await f.password.fill("Rahasia123!");
    await f.submit.click();
    await expect(f.submit).toBeDisabled();
    await expect(f.submit).toHaveText("Memverifikasi...");
    await f.submit.click({ force: true }).catch(() => {});
    await expect(page).toHaveURL(/\/dashboard\/client$/);
    expect(api.calls("POST", "/auth/login-password")).toHaveLength(1);
  });

  test(...tc("AUTH-010", "Toggle tampilkan/sembunyikan password", {
    feature: F_LOGIN, type: "E2E",
    input: "Ketik password lalu klik ikon mata dua kali",
    expected: "type input berubah password → text → password",
  }), async ({ page }) => {
    await page.goto("/auth/login");
    const f = login(page);
    await f.password.fill("Rahasia123!");
    await expect(f.password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Tampilkan password" }).click();
    await expect(f.password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Sembunyikan password" }).click();
    await expect(f.password).toHaveAttribute("type", "password");
  });

  test(...tc("AUTH-011", "Pesan error berisi payload XSS dirender sebagai teks (tidak dieksekusi)", {
    feature: F_LOGIN, type: "Security",
    input: "Backend 400 detail='<img src=x onerror=alert(\"xss\")>'",
    expected: "Teks payload tampil apa adanya, tidak ada dialog alert yang muncul",
  }), async ({ page, api, dialogs }) => {
    const payload = '<img src=x onerror=alert("xss")>';
    api.on("POST", "/auth/login-password", { status: 400, json: { detail: payload } });
    await page.goto("/auth/login");
    const f = login(page);
    await f.email.fill("budi@example.com");
    await f.password.fill(`'; DROP TABLE users; --`);
    await f.submit.click();
    await expect(f.error).toHaveText(payload);
    await page.waitForTimeout(300);
    expect(dialogs.messages).toHaveLength(0);
  });

  test(...tc("AUTH-012", "Link 'Lupa Password?' dan 'Daftar' mengarah ke halaman yang benar", {
    feature: F_LOGIN, type: "E2E",
    input: "Klik 'Lupa Password?' lalu kembali dan klik 'Daftar'",
    expected: "Masing-masing menuju /auth/forgot-password dan /auth/role",
  }), async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "Lupa Password?" }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password$/);
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "Daftar" }).click();
    await expect(page).toHaveURL(/\/auth\/role$/);
  });

  test(...tc("AUTH-013", "User yang sudah login membuka /auth/login diarahkan ke dashboard", {
    feature: F_LOGIN, type: "Regression",
    input: "Sesi client aktif di localStorage, buka /auth/login",
    expected: "Redirect otomatis ke /dashboard/client (AuthGuard redirectToRoleHome)",
  }), async ({ page, loginAs }) => {
    knownDefect("BUG-14");
    await loginAs("client");
    await page.goto("/auth/login");
    await expect(page).toHaveURL(/\/dashboard\/client$/, { timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════════ GOOGLE OAUTH
test.describe("Login Google @auth", () => {
  test(...tc("AUTH-014", "Login Google mengarahkan ke URL OAuth & menyimpan code_verifier", {
    feature: F_GOOGLE, type: "E2E",
    input: "Klik 'Masuk dengan Google', backend mengembalikan {url, code_verifier}",
    expected: "POST /auth/oauth/google dengan redirectTo=<origin>/auth/callback, code_verifier tersimpan di sessionStorage, browser pindah ke URL Google",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/oauth/google", {
      json: { data: { url: "https://accounts.google.com/o/oauth2/auth?client_id=x", code_verifier: "verifier-xyz" } },
    });
    await page.goto("/auth/login");
    await page.getByTestId("google-login-btn").click();
    await page.waitForURL(/accounts\.google\.com/);
    const req = api.calls("POST", "/auth/oauth/google")[0];
    expect(req.body.redirectTo).toMatch(/\/auth\/callback$/);
    await page.goBack();
    expect(await page.evaluate(() => sessionStorage.getItem("pending_oauth_verifier"))).toBe("verifier-xyz");
  });

  test(...tc("AUTH-015", "Login Google gagal (URL kosong / error server) menampilkan pesan", {
    feature: F_GOOGLE, type: "Negative",
    input: "Backend mengembalikan data tanpa url",
    expected: "Pesan 'Gagal menyiapkan login Google.' tampil, tetap di halaman login",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/oauth/google", { json: { data: {} } });
    await page.goto("/auth/login");
    await page.getByTestId("google-login-btn").click();
    await expect(page.getByTestId("login-error-msg")).toHaveText("Gagal menyiapkan login Google.");
  });
});

// ═══════════════════════════════════════════════════════════════ ROLE & SIGNUP
test.describe("Role & Signup @auth", () => {
  test(...tc("AUTH-016", "Pilih role Konsultan lalu lanjut ke form signup konsultan", {
    feature: F_ROLE, type: "E2E",
    input: "Di /auth/role pilih kartu 'Konsultan Hukum' lalu klik 'Lanjutkan'",
    expected: "sessionStorage pending_role=konsultan, redirect /auth/signup dengan judul 'Daftar sebagai Konsultan'",
    tags: ["@mobile"],
  }), async ({ page }) => {
    await page.goto("/auth/role");
    await expect(page.locator('[data-testid="role-card-client"] input')).toBeChecked();
    await page.getByTestId("role-card-konsultan").click();
    await page.getByTestId("role-continue-btn").click();
    await expect(page).toHaveURL(/\/auth\/signup$/);
    await expect(page.getByText("Daftar sebagai Konsultan")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("pending_role"))).toBe("konsultan");
  });

  test(...tc("AUTH-017", "Akses /auth/signup langsung tanpa memilih role diarahkan ke /auth/role", {
    feature: F_SIGNUP, type: "Negative",
    input: "Buka /auth/signup dengan sessionStorage kosong",
    expected: "Redirect ke /auth/role",
  }), async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page).toHaveURL(/\/auth\/role$/);
  });

  test(...tc("AUTH-018", "Signup sukses mengirim data lengkap dan menuju verifikasi OTP", {
    feature: F_SIGNUP, type: "E2E",
    input: "role=client, name='Budi Santoso', email=budi.baru@example.com, password=Rahasia123!",
    expected: "POST /auth/signup {email,password,name,role:'client',emailRedirectTo:'…/auth/callback'}, pending_auth tersimpan, redirect /auth/verify",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("POST", "/auth/signup", { json: { data: { session: null, user: { id: "u1" } } } });
    await presetSessionStorage(page, { pending_role: "client" });
    await page.goto("/auth/signup");
    await expect(page.getByText("Daftar sebagai Client")).toBeVisible();
    await page.getByTestId("signup-name-input").fill("Budi Santoso");
    await page.getByTestId("signup-email-input").fill("budi.baru@example.com");
    await page.getByTestId("signup-password-input").fill("Rahasia123!");
    await page.getByTestId("signup-submit-btn").click();
    await expect(page).toHaveURL(/\/auth\/verify$/);
    const req = api.calls("POST", "/auth/signup")[0];
    expect(req.body).toMatchObject({ email: "budi.baru@example.com", password: "Rahasia123!", name: "Budi Santoso", role: "client" });
    expect(req.body.emailRedirectTo).toMatch(/\/auth\/callback$/);
    const pending = JSON.parse(await page.evaluate(() => sessionStorage.getItem("pending_auth")));
    expect(pending).toEqual({ email: "budi.baru@example.com", role: "client", flow: "signup" });
  });

  test(...tc("AUTH-019", "Signup email sudah terdaftar menampilkan error backend", {
    feature: F_SIGNUP, type: "Negative",
    input: "Backend 400 detail='User already registered'",
    expected: "Pesan 'User already registered' tampil, tetap di /auth/signup",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/signup", { status: 400, json: { detail: "User already registered" } });
    await presetSessionStorage(page, { pending_role: "client" });
    await page.goto("/auth/signup");
    await page.getByTestId("signup-name-input").fill("Budi");
    await page.getByTestId("signup-email-input").fill("budi@example.com");
    await page.getByTestId("signup-password-input").fill("Rahasia123!");
    await page.getByTestId("signup-submit-btn").click();
    await expect(page.getByTestId("signup-error-msg")).toHaveText("User already registered");
    await expect(page).toHaveURL(/\/auth\/signup$/);
  });

  test(...tc("AUTH-020", "Nama dengan unicode/emoji dikirim utuh", {
    feature: F_SIGNUP, type: "Edge Case",
    input: "name='Ñandú 测试 🚀', password=Rahasia123!",
    expected: "Body request berisi nama yang sama persis",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/signup", { json: { data: { session: null } } });
    await presetSessionStorage(page, { pending_role: "konsultan" });
    await page.goto("/auth/signup");
    await page.getByTestId("signup-name-input").fill("Ñandú 测试 🚀");
    await page.getByTestId("signup-email-input").fill("unicode@example.com");
    await page.getByTestId("signup-password-input").fill("Rahasia123!");
    await page.getByTestId("signup-submit-btn").click();
    const req = await api.waitFor("POST", "/auth/signup");
    expect(req.body.name).toBe("Ñandú 测试 🚀");
    expect(req.body.role).toBe("konsultan");
  });

  test(...tc("AUTH-021", "Password lemah (3 karakter) ditolak di sisi klien sebelum dikirim", {
    feature: F_SIGNUP, type: "Negative",
    input: "password='123'",
    expected: "Muncul pesan validasi minimal panjang password; tidak ada request ke /auth/signup (konsisten dengan halaman reset password yang mewajibkan min. 6 karakter)",
  }), async ({ page, api }) => {
    knownDefect("BUG-21");
    api.on("POST", "/auth/signup", { status: 422, json: { detail: "Password should be at least 6 characters" } });
    await presetSessionStorage(page, { pending_role: "client" });
    await page.goto("/auth/signup");
    await page.getByTestId("signup-name-input").fill("Budi");
    await page.getByTestId("signup-email-input").fill("budi@example.com");
    await page.getByTestId("signup-password-input").fill("123");
    await page.getByTestId("signup-submit-btn").click();
    await page.waitForTimeout(800);
    expect(api.calls("POST", "/auth/signup")).toHaveLength(0);
  });

  test(...tc("AUTH-022", "Field nama kosong diblokir validasi HTML5", {
    feature: F_SIGNUP, type: "Negative",
    input: "name kosong, email & password valid",
    expected: "Form tidak tersubmit, tidak ada request API",
  }), async ({ page, api }) => {
    await presetSessionStorage(page, { pending_role: "client" });
    await page.goto("/auth/signup");
    await page.getByTestId("signup-email-input").fill("budi@example.com");
    await page.getByTestId("signup-password-input").fill("Rahasia123!");
    await page.getByTestId("signup-submit-btn").click();
    expect(await page.getByTestId("signup-name-input").evaluate((el) => el.validity.valueMissing)).toBe(true);
    expect(api.calls("POST", "/auth/signup")).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════ OTP
test.describe("Verifikasi OTP @auth", () => {
  const otpInputs = (page) => page.locator('input[inputmode="numeric"]');

  test(...tc("AUTH-023", "Verifikasi OTP signup konsultan → set role → dashboard konsultan", {
    feature: F_OTP, type: "E2E",
    input: "pending_auth={email, role:'konsultan', flow:'signup'}, OTP='123456'",
    expected: "POST /auth/verify-otp {type:'signup'}, POST /auth/role {role:'konsultan'}, redirect /dashboard/consultant",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.asConsultant();
    api.on("POST", "/auth/verify-otp", { json: { data: { session: session("konsultan") } } });
    api.on("POST", "/auth/role", { json: { data: { role: "konsultan" } } });
    await presetSessionStorage(page, { pending_auth: JSON.stringify({ email: "siti@example.com", role: "konsultan", flow: "signup" }) });
    await page.goto("/auth/verify");
    const verifyBtn = page.getByRole("button", { name: "Verifikasi" });
    await expect(verifyBtn).toBeDisabled();
    const inputs = otpInputs(page);
    for (let i = 0; i < 6; i++) await inputs.nth(i).fill(String(i + 1));
    await expect(verifyBtn).toBeEnabled();
    await verifyBtn.click();
    await expect(page).toHaveURL(/\/dashboard\/consultant$/);
    expect(api.calls("POST", "/auth/verify-otp")[0].body).toEqual({ email: "siti@example.com", token: "123456", type: "signup" });
    expect(api.calls("POST", "/auth/role")[0].body).toEqual({ role: "konsultan" });
  });

  test(...tc("AUTH-024", "Input OTP hanya menerima alfanumerik & auto-focus ke kotak berikutnya", {
    feature: F_OTP, type: "Edge Case",
    input: "Ketik '!' di kotak 1, lalu '7' di kotak 1, lalu Backspace di kotak 2 kosong",
    expected: "Karakter '!' diabaikan, '7' diterima lalu fokus pindah ke kotak 2, Backspace mengembalikan fokus ke kotak 1",
  }), async ({ page }) => {
    await page.goto("/auth/verify");
    const inputs = otpInputs(page);
    await inputs.nth(0).pressSequentially("!");
    await expect(inputs.nth(0)).toHaveValue("");
    await inputs.nth(0).pressSequentially("7");
    await expect(inputs.nth(0)).toHaveValue("7");
    await expect(inputs.nth(1)).toBeFocused();
    await page.keyboard.press("Backspace");
    await expect(inputs.nth(0)).toBeFocused();
  });

  test(...tc("AUTH-025", "Paste kode OTP 6 digit mengisi semua kotak", {
    feature: F_OTP, type: "E2E",
    input: "Paste teks ' 654 321 ' (dengan spasi) ke kotak pertama",
    expected: "Kotak terisi 6,5,4,3,2,1 dan tombol Verifikasi aktif",
  }), async ({ page }) => {
    await page.goto("/auth/verify");
    const inputs = otpInputs(page);
    await inputs.nth(0).focus();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData("text", " 654 321 ");
      document.activeElement.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
    });
    const values = await inputs.evaluateAll((els) => els.map((e) => e.value).join(""));
    expect(values).toBe("654321");
    await expect(page.getByRole("button", { name: "Verifikasi" })).toBeEnabled();
  });

  test(...tc("AUTH-026", "OTP salah/kedaluwarsa menampilkan pesan error", {
    feature: F_OTP, type: "Negative",
    input: "OTP='000000', backend 400 'Token has expired or is invalid'",
    expected: "Pesan error tampil dan tetap di /auth/verify",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/verify-otp", { status: 400, json: { detail: "Token has expired or is invalid" } });
    await presetSessionStorage(page, { pending_auth: JSON.stringify({ email: "a@example.com", role: "client", flow: "signup" }) });
    await page.goto("/auth/verify");
    const inputs = otpInputs(page);
    for (let i = 0; i < 6; i++) await inputs.nth(i).fill("0");
    await page.getByRole("button", { name: "Verifikasi" }).click();
    await expect(page.getByText("Token has expired or is invalid")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/verify$/);
  });

  test(...tc("AUTH-027", "Kirim ulang OTP memanggil endpoint resend & mengosongkan input", {
    feature: F_OTP, type: "E2E",
    input: "pending_auth flow=signup, isi 3 digit lalu klik 'Kirim Ulang'",
    expected: "POST /auth/resend-signup-otp {email}, semua kotak OTP kosong",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/resend-signup-otp", { json: { data: { sent: true } } });
    await presetSessionStorage(page, { pending_auth: JSON.stringify({ email: "a@example.com", role: "client", flow: "signup" }) });
    await page.goto("/auth/verify");
    const inputs = otpInputs(page);
    for (let i = 0; i < 3; i++) await inputs.nth(i).fill("9");
    await page.getByRole("button", { name: "Kirim Ulang" }).click();
    const req = await api.waitFor("POST", "/auth/resend-signup-otp");
    expect(req.body.email).toBe("a@example.com");
    await expect(inputs.nth(0)).toHaveValue("");
  });

  test(...tc("AUTH-028", "Verifikasi tanpa data pending_auth diarahkan ke login", {
    feature: F_OTP, type: "Negative",
    input: "sessionStorage kosong, isi OTP 6 digit, klik Verifikasi",
    expected: "Redirect ke /auth/login, tidak ada request verify-otp",
  }), async ({ page, api }) => {
    await page.goto("/auth/verify");
    const inputs = otpInputs(page);
    for (let i = 0; i < 6; i++) await inputs.nth(i).fill("1");
    await page.getByRole("button", { name: "Verifikasi" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(api.calls("POST", "/auth/verify-otp")).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════ FORGOT / RESET
test.describe("Lupa & Reset Password @auth", () => {
  test(...tc("AUTH-029", "Lupa password sukses menampilkan konfirmasi tautan terkirim", {
    feature: F_FORGOT, type: "E2E",
    input: "email=budi@example.com",
    expected: "POST /auth/forgot-password {email, emailRedirectTo:'…/auth/reset-password'}, teks 'Tautan Terkirim!' + email tampil",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/forgot-password", { json: { data: { sent: true } } });
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email").fill("budi@example.com");
    await page.getByRole("button", { name: "Kirim Link Reset" }).click();
    await expect(page.getByText("Tautan Terkirim!")).toBeVisible();
    await expect(page.getByText(/budi@example\.com/)).toBeVisible();
    const req = api.calls("POST", "/auth/forgot-password")[0];
    expect(req.body.emailRedirectTo).toMatch(/\/auth\/reset-password$/);
  });

  test(...tc("AUTH-030", "Lupa password: error backend ditampilkan & email kosong diblokir", {
    feature: F_FORGOT, type: "Negative",
    input: "(a) submit kosong, (b) email tidak terdaftar → backend 404 'User not found'",
    expected: "(a) tidak ada request, (b) pesan 'User not found' tampil",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/forgot-password", { status: 404, json: { detail: "User not found" } });
    await page.goto("/auth/forgot-password");
    await page.getByRole("button", { name: "Kirim Link Reset" }).click();
    expect(api.calls("POST", "/auth/forgot-password")).toHaveLength(0);
    await page.getByLabel("Email").fill("tidakada@example.com");
    await page.getByRole("button", { name: "Kirim Link Reset" }).click();
    await expect(page.getByText("User not found")).toBeVisible();
  });

  test(...tc("AUTH-031", "Link reset tanpa token menampilkan 'Link Tidak Valid'", {
    feature: F_RESET, type: "Negative",
    input: "Buka /auth/reset-password tanpa query",
    expected: "Judul 'Link Tidak Valid' + tombol 'Minta Link Baru' ke /auth/forgot-password",
  }), async ({ page }) => {
    await page.goto("/auth/reset-password");
    await expect(page.getByRole("heading", { name: "Link Tidak Valid" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Minta Link Baru" })).toHaveAttribute("href", "/auth/forgot-password");
  });

  test(...tc("AUTH-032", "Link reset kedaluwarsa menampilkan pesan khusus", {
    feature: F_RESET, type: "Negative",
    input: "token=abc&type=recovery&email=…, backend 400 'Token has expired'",
    expected: "Pesan 'Link reset password sudah kadaluarsa…' tampil",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/verify-otp", { status: 400, json: { detail: "Token has expired" } });
    await page.goto("/auth/reset-password?token=abc&type=recovery&email=budi%40example.com");
    await expect(page.getByText(/sudah kadaluarsa/)).toBeVisible();
  });

  test(...tc("AUTH-033", "Reset password: validasi kosong, tidak cocok, dan terlalu pendek", {
    feature: F_RESET, type: "Negative",
    input: "(a) kosong, (b) 'Rahasia123'/'Rahasia124', (c) '12345'/'12345'",
    expected: "Pesan: 'Semua kolom wajib diisi.', 'Password dan konfirmasi password tidak cocok.', 'Password minimal 6 karakter.'; tidak ada request reset",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/verify-otp", { json: { data: { session: session("client") } } });
    await page.goto("/auth/reset-password?token=abc&type=recovery&email=budi%40example.com");
    const submit = page.getByRole("button", { name: "Simpan Password Baru" });
    await submit.click();
    await expect(page.getByText("Semua kolom wajib diisi.")).toBeVisible();
    await page.locator('input[name="newPassword"]').fill("Rahasia123");
    await page.locator('input[name="confirmPassword"]').fill("Rahasia124");
    await submit.click();
    await expect(page.getByText("Password dan konfirmasi password tidak cocok.")).toBeVisible();
    await page.locator('input[name="newPassword"]').fill("12345");
    await page.locator('input[name="confirmPassword"]').fill("12345");
    await submit.click();
    await expect(page.getByText("Password minimal 6 karakter.")).toBeVisible();
    expect(api.calls("POST", "/auth/reset-password")).toHaveLength(0);
  });

  test(...tc("AUTH-034", "Reset password sukses lalu diarahkan ke login", {
    feature: F_RESET, type: "E2E",
    input: "token valid, password baru 'PasswordBaru1!' (cocok)",
    expected: "POST /auth/reset-password {new_password}, alert sukses, redirect /auth/login",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/auth/verify-otp", { json: { data: { session: session("client") } } });
    api.on("POST", "/auth/reset-password", { json: { data: { updated: true } } });
    await page.goto("/auth/reset-password?token=abc&type=recovery&email=budi%40example.com");
    await page.locator('input[name="newPassword"]').fill("PasswordBaru1!");
    await page.locator('input[name="confirmPassword"]').fill("PasswordBaru1!");
    await page.getByRole("button", { name: "Simpan Password Baru" }).click();
    await dialogs.waitFor("Password berhasil diubah");
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(api.calls("POST", "/auth/reset-password")[0].body).toEqual({ new_password: "PasswordBaru1!" });
    expect(api.calls("POST", "/auth/verify-otp")[0].body).toEqual({ email: "budi@example.com", token: "abc", type: "recovery" });
  });
});

test.describe("Aksesibilitas form password @auth", () => {
  test(...tc("AUTH-043", "Label form reset password terhubung ke input yang benar (id unik)", {
    feature: F_RESET, type: "Accessibility",
    input: "Buka form reset password (token valid), klik label 'Konfirmasi Password Baru'",
    expected: "Setiap input punya id unik; klik label memfokuskan input konfirmasi (name=confirmPassword)",
  }), async ({ page, api }) => {
    knownDefect("BUG-33");
    api.on("POST", "/auth/verify-otp", { json: { data: { session: session("client") } } });
    await page.goto("/auth/reset-password?token=abc&type=recovery&email=budi%40example.com");
    await page.locator('input[name="confirmPassword"]').waitFor();
    const ids = await page.locator("input").evaluateAll((els) => els.map((e) => e.id));
    expect(new Set(ids).size, `id input: ${ids.join(",")}`).toBe(ids.length);
    await page.getByText("Konfirmasi Password Baru").click();
    await expect(page.locator('input[name="confirmPassword"]')).toBeFocused();
  });
});

// ═══════════════════════════════════════════════════════════════ CREATE PASSWORD
test.describe("Create Password @auth", () => {
  test(...tc("AUTH-035", "Create password: validasi panjang & konfirmasi", {
    feature: F_CREATE, type: "Negative",
    input: "(a) '123'/'123', (b) 'Rahasia123'/'Beda123'",
    expected: "Pesan 'Password minimal 6 karakter.' lalu 'Password dan konfirmasi password tidak cocok.'",
  }), async ({ page }) => {
    await page.goto("/auth/create-password");
    await page.getByTestId("create-password-input").fill("123");
    await page.getByTestId("create-password-confirm-input").fill("123");
    await page.getByTestId("create-password-submit-btn").click();
    await expect(page.getByTestId("create-password-error-msg")).toHaveText("Password minimal 6 karakter.");
    await page.getByTestId("create-password-input").fill("Rahasia123");
    await page.getByTestId("create-password-confirm-input").fill("Beda123");
    await page.getByTestId("create-password-submit-btn").click();
    await expect(page.getByTestId("create-password-error-msg")).toHaveText("Password dan konfirmasi password tidak cocok.");
  });

  test(...tc("AUTH-036", "Create password valid tersimpan lalu redirect ke dashboard sesuai role", {
    feature: F_CREATE, type: "E2E",
    input: "pending_create_password={role:'client'}, password 'Rahasia123!' (cocok)",
    expected: "Password tersimpan via API dan redirect ke /dashboard/client tanpa error",
  }), async ({ page, api, loginAs }) => {
    knownDefect("BUG-02");
    await loginAs("client");
    api.on("POST", /\/auth\/(create-password|set-password|reset-password)$/, { json: { data: { updated: true } } });
    await presetSessionStorage(page, { pending_create_password: JSON.stringify({ role: "client" }) });
    await page.goto("/auth/create-password");
    await page.getByTestId("create-password-input").fill("Rahasia123!");
    await page.getByTestId("create-password-confirm-input").fill("Rahasia123!");
    await page.getByTestId("create-password-submit-btn").click();
    await expect(page.getByTestId("create-password-error-msg")).toHaveCount(0, { timeout: 3000 });
    await expect(page).toHaveURL(/\/dashboard\/client$/, { timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════════ CALLBACK
test.describe("OAuth Callback @auth", () => {
  test(...tc("AUTH-037", "Callback dengan error dari provider menampilkan pesan & tombol kembali", {
    feature: F_CALLBACK, type: "Negative",
    input: "/auth/callback?error_description=Akses%20ditolak%20pengguna",
    expected: "Judul 'Terjadi Kesalahan', teks 'Akses ditolak pengguna', tombol 'Kembali ke Login' → /auth/login",
  }), async ({ page }) => {
    await page.goto("/auth/callback?error_description=Akses%20ditolak%20pengguna");
    await expect(page.getByText("Terjadi Kesalahan")).toBeVisible();
    await expect(page.getByText("Akses ditolak pengguna")).toBeVisible();
    await page.getByRole("button", { name: "Kembali ke Login" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test(...tc("AUTH-038", "Callback tanpa parameter code diarahkan ke login", {
    feature: F_CALLBACK, type: "Negative",
    input: "/auth/callback",
    expected: "Redirect ke /auth/login",
  }), async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test(...tc("AUTH-039", "Callback signup Google konsultan: tukar code, set role, ke dashboard konsultan", {
    feature: F_CALLBACK, type: "E2E",
    input: "?code=oauth-code, sessionStorage pending_oauth_verifier=ver-1, pending_auth={role:'konsultan',flow:'oauth_signup'}",
    expected: "POST /auth/exchange-code {code, code_verifier}, POST /auth/role {role:'konsultan'}, redirect /dashboard/consultant",
  }), async ({ page, api }) => {
    api.asConsultant();
    api.on("POST", "/auth/exchange-code", { json: { data: { session: session("konsultan") } } });
    api.on("POST", "/auth/role", { json: { data: { role: "konsultan" } } });
    await presetSessionStorage(page, {
      pending_oauth_verifier: "ver-1",
      pending_auth: JSON.stringify({ role: "konsultan", flow: "oauth_signup" }),
    });
    await page.goto("/auth/callback?code=oauth-code");
    await expect(page).toHaveURL(/\/dashboard\/consultant$/);
    expect(api.calls("POST", "/auth/exchange-code")[0].body).toEqual({ code: "oauth-code", code_verifier: "ver-1" });
    expect(api.calls("POST", "/auth/role")[0].body).toEqual({ role: "konsultan" });
  });

  test(...tc("AUTH-040", "Callback user baru tanpa role otomatis menjadi client", {
    feature: F_CALLBACK, type: "Edge Case",
    input: "?code=x, profile.role=null",
    expected: "POST /auth/role {role:'client'} lalu redirect /dashboard/client",
  }), async ({ page, api }) => {
    api.asClient();
    api.on("POST", "/auth/exchange-code", { json: { data: { session: session("client") } } });
    let profileCalls = 0;
    api.on("GET", "/auth/profile", () => ({ json: { data: { ...USERS.client, role: profileCalls++ === 0 ? null : "client" } } }));
    api.on("POST", "/auth/role", { json: { data: { role: "client" } } });
    await page.goto("/auth/callback?code=x");
    await expect(page).toHaveURL(/\/dashboard\/client$/);
    expect(api.calls("POST", "/auth/role")[0].body).toEqual({ role: "client" });
  });

  test(...tc("AUTH-041", "Parameter 'next' eksternal tidak boleh menjadi open redirect", {
    feature: F_CALLBACK, type: "Security",
    input: "?code=x&next=https://evil.example/phishing",
    expected: "User tetap berada di origin aplikasi (tidak diarahkan ke evil.example)",
  }), async ({ page, api }) => {
    knownDefect("BUG-07");
    api.asClient();
    api.on("POST", "/auth/exchange-code", { json: { data: { session: session("client") } } });
    await page.goto("/auth/callback?code=x&next=https://evil.example/phishing");
    await page.waitForTimeout(2500);
    expect(new URL(page.url()).hostname).not.toBe("evil.example");
  });

  test(...tc("AUTH-042", "Gagal menukar code menampilkan pesan error", {
    feature: F_CALLBACK, type: "Negative",
    input: "?code=expired, backend 400 'invalid flow state'",
    expected: "Pesan 'invalid flow state' tampil pada halaman callback",
  }), async ({ page, api }) => {
    api.on("POST", "/auth/exchange-code", { status: 400, json: { detail: "invalid flow state" } });
    await page.goto("/auth/callback?code=expired");
    await expect(page.getByText("invalid flow state")).toBeVisible();
  });
});
