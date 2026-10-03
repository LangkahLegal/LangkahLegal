/**
 * F27 Pengaturan (profil ringkas, tema, logout), F28 Edit Profil, F29 Keamanan & Sandi,
 * F30 Bahasa, F31 Tentang Aplikasi.
 */
import { test, expect, tc, knownDefect } from "../support/fixtures.js";
import { multipartField, multipartFilenames } from "../support/mock-api.js";
import { USERS } from "../support/mock-data.js";

const F_SET = "F27 Pengaturan Akun (Tema & Logout)";
const F_PRF = "F28 Edit Profil (Client & Konsultan)";
const F_SEC = "F29 Keamanan & Ganti Kata Sandi";
const F_LNG = "F30 Pengaturan Bahasa";
const F_ABT = "F31 Tentang Aplikasi";

const item = (page, label) => page.locator("div.cursor-pointer", { hasText: label });

// ═══════════════════════════════════════════════════════════════ SETTINGS HOME
test.describe("Pengaturan @settings", () => {
  test(...tc("SET-001", "Halaman pengaturan menampilkan kartu profil & grup menu", {
    feature: F_SET, type: "E2E",
    input: "Sesi client, buka /setting",
    expected: "Nama & email user, menu 'Profil Saya', 'Bahasa', 'Tema Aplikasi', 'Keamanan & Sandi', 'Tentang LangkahLegal', 'Keluar'",
    tags: ["@smoke", "@mobile"],
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/setting");
    await expect(page.getByRole("heading", { name: "Budi Santoso" })).toBeVisible();
    await expect(page.getByText("budi.client@example.com")).toBeVisible();
    for (const l of ["Profil Saya", "Bahasa", "Tema Aplikasi", "Keamanan & Sandi", "Tentang LangkahLegal", "Keluar"]) await expect(page.getByText(l, { exact: true })).toBeVisible();
  });

  test(...tc("SET-002", "Badge status verifikasi tampil untuk konsultan", {
    feature: F_SET, type: "Regression",
    input: "Sesi konsultan status_verifikasi=terverifikasi",
    expected: "Badge 'Terverifikasi' pada kartu profil",
  }), async ({ page, loginAs }) => {
    await loginAs("konsultan");
    await page.goto("/setting");
    await expect(page.getByText("Terverifikasi", { exact: true })).toBeVisible();
  });

  test(...tc("SET-003", "Toggle tema terang/gelap & tersimpan setelah reload", {
    feature: F_SET, type: "E2E",
    input: "Klik menu 'Tema Aplikasi' lalu reload",
    expected: "Class <html> berubah ke 'dark-tech', deskripsi 'Mode Gelap (Aktif)', localStorage user-pref-theme='dark-tech' bertahan setelah reload",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/setting");
    await expect(page.locator("html")).toHaveClass(/theme-white-modern/);
    await item(page, "Tema Aplikasi").click();
    await expect(page.locator("html")).toHaveClass(/dark-tech/);
    await expect(page.getByText("Mode Gelap (Aktif)")).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark-tech/);
    expect(await page.evaluate(() => localStorage.getItem("user-pref-theme"))).toBe("dark-tech");
  });

  test(...tc("SET-004", "Logout menghapus sesi & kembali ke login", {
    feature: F_SET, type: "E2E",
    input: "Klik 'Keluar' → konfirmasi OK",
    expected: "POST /auth/logout, semua token di localStorage terhapus, redirect /auth/login",
    tags: ["@smoke"],
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    await page.goto("/setting");
    await item(page, "Keluar").click();
    await dialogs.waitFor("Apakah Anda yakin ingin keluar?");
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(api.calls("POST", "/auth/logout")).toHaveLength(1);
    const left = await page.evaluate(() => ["ll_token", "token", "ll_refresh", "refresh_token", "ll_role", "role"].map((k) => localStorage.getItem(k)));
    expect(left.every((v) => v === null)).toBe(true);
  });

  test(...tc("SET-005", "Logout tetap membersihkan sesi meski API logout gagal; batal tidak logout", {
    feature: F_SET, type: "Negative",
    input: "(a) confirm Cancel → tidak terjadi apa-apa; (b) confirm OK, POST /auth/logout → 500",
    expected: "(a) tetap di /setting tanpa request; (b) token terhapus & redirect /auth/login",
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    api.on("POST", "/auth/logout", { status: 500, json: {} });
    await page.goto("/setting");
    dialogs.confirmResult = false;
    await item(page, "Keluar").click();
    await page.waitForTimeout(300);
    expect(api.calls("POST", "/auth/logout")).toHaveLength(0);
    await expect(page).toHaveURL(/\/setting$/);
    dialogs.confirmResult = true;
    await item(page, "Keluar").click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(await page.evaluate(() => localStorage.getItem("ll_token"))).toBeNull();
  });

  test(...tc("SET-006", "Klik area kosong halaman tidak boleh mengganti tema", {
    feature: F_SET, type: "Edge Case",
    input: "Klik area kosong di pojok kanan bawah halaman pengaturan",
    expected: "Tema tetap 'theme-white-modern' (tidak ada perubahan tak sengaja)",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/setting");
    await page.mouse.click(1430, 890);
    await expect(page.locator("html")).toHaveClass(/theme-white-modern/);
  });

  test(...tc("SET-007", "Navigasi menu pengaturan ke sub-halaman", {
    feature: F_SET, type: "E2E",
    input: "Klik Profil Saya, Bahasa, Keamanan & Sandi, Tentang LangkahLegal (kembali ke /setting tiap kali)",
    expected: "Masing-masing menuju /setting/profile, /setting/language, /setting/security, /setting/about",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    for (const [label, path] of [["Profil Saya", "/setting/profile"], ["Bahasa", "/setting/language"], ["Keamanan & Sandi", "/setting/security"], ["Tentang LangkahLegal", "/setting/about"]]) {
      await page.goto("/setting");
      await item(page, label).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });
});

// ═══════════════════════════════════════════════════════════════ EDIT PROFILE
test.describe("Edit Profil @profile", () => {
  const name = (page) => page.getByPlaceholder("John Doe");

  test(...tc("PRF-001", "Client mengubah nama & tersimpan", {
    feature: F_PRF, type: "E2E",
    input: "Ubah nama menjadi 'Budi Santoso Updated' → 'Simpan Perubahan'",
    expected: "Form terisi data awal; PUT /users/me/profile/update (form-data nama='Budi Santoso Updated'), field kosong tidak dikirim; redirect /setting",
    tags: ["@smoke"],
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("PUT", "/users/me/profile/update", { json: { message: "ok" } });
    await page.goto("/setting/profile");
    await expect(name(page)).toHaveValue("Budi Santoso");
    await expect(page.getByPlaceholder("example@langkahlegal.id")).toHaveValue("budi.client@example.com");
    await expect(page.getByText("Kredensial Profesional")).toHaveCount(0);
    await name(page).fill("Budi Santoso Updated");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(page).toHaveURL(/\/setting$/);
    const body = api.calls("PUT", "/users/me/profile/update")[0].body;
    expect(multipartField(body, "nama")).toBe("Budi Santoso Updated");
    expect(multipartField(body, "tarif_per_sesi")).toBeUndefined();
  });

  test(...tc("PRF-002", "Perubahan email disimpan atau field email dibuat read-only", {
    feature: F_PRF, type: "Regression",
    input: "Ubah email menjadi 'baru@example.com' → Simpan",
    expected: "Payload memuat email baru, ATAU field email tidak dapat diedit (tidak menyesatkan user)",
  }), async ({ page, api, loginAs }) => {
    knownDefect("BUG-24");
    await loginAs("client");
    api.on("PUT", "/users/me/profile/update", { json: { message: "ok" } });
    await page.goto("/setting/profile");
    const email = page.getByPlaceholder("example@langkahlegal.id");
    const editable = await email.isEditable();
    if (editable) {
      await email.fill("baru@example.com");
      await page.getByRole("button", { name: "Simpan Perubahan" }).click();
      await api.waitFor("PUT", "/users/me/profile/update");
      expect(multipartField(api.calls("PUT", "/users/me/profile/update")[0].body, "email")).toBe("baru@example.com");
    }
  });

  test(...tc("PRF-003", "Konsultan memperbarui kredensial profesional & portofolio PDF", {
    feature: F_PRF, type: "E2E",
    input: "Tarif 200000, pengalaman 9, spesialisasi 'Pidana', kota 'Surabaya', upload 'portofolio.pdf'",
    expected: "Bagian 'Kredensial Profesional' tampil; payload multipart berisi tarif_per_sesi=200000, pengalaman_tahun=9, spesialisasi=Pidana, kota_praktik=Surabaya, portofolio_file=portofolio.pdf",
  }), async ({ page, api, loginAs }) => {
    await loginAs("konsultan");
    api.on("PUT", "/users/me/profile/update", { json: { message: "ok" } });
    await page.goto("/setting/profile");
    await expect(page.getByText("Kredensial Profesional")).toBeVisible();
    await page.getByPlaceholder("Rp 150.000").fill("200000");
    await page.getByPlaceholder("Contoh: 5").fill("9");
    await page.locator("div.space-y-3", { has: page.locator("label", { hasText: /^Spesialisasi$/ }) }).locator("div.cursor-pointer").first().click();
    await page.locator(".max-h-60 > div").filter({ hasText: /^Pidana$/ }).click();
    await page.locator("label", { hasText: /^Kota Praktik$/ }).locator("xpath=following-sibling::input").fill("Surabaya");
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles({ name: "portofolio.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await expect(page.getByText("portofolio.pdf").first()).toBeVisible();
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(page).toHaveURL(/\/setting$/);
    const body = api.calls("PUT", "/users/me/profile/update")[0].body;
    expect(multipartField(body, "tarif_per_sesi")).toBe("200000");
    expect(multipartField(body, "pengalaman_tahun")).toBe("9");
    expect(multipartField(body, "spesialisasi")).toBe("Pidana");
    expect(multipartField(body, "kota_praktik")).toBe("Surabaya");
    expect(multipartFilenames(body, "portofolio_file")).toEqual(["portofolio.pdf"]);
  });

  test(...tc("PRF-004", "Tarif & pengalaman bernilai negatif ditolak", {
    feature: F_PRF, type: "Negative",
    input: "Tarif '-50000', pengalaman '-3' → Simpan",
    expected: "Pesan validasi tampil; nilai negatif tidak dikirim ke server",
  }), async ({ page, api, loginAs }) => {
    knownDefect("BUG-30");
    await loginAs("konsultan");
    api.on("PUT", "/users/me/profile/update", { json: { message: "ok" } });
    await page.goto("/setting/profile");
    await page.getByPlaceholder("Rp 150.000").fill("-50000");
    await page.getByPlaceholder("Contoh: 5").fill("-3");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await page.waitForTimeout(800);
    const sent = api.calls("PUT", "/users/me/profile/update")[0]?.body;
    expect(multipartField(sent, "tarif_per_sesi")).not.toBe("-50000");
  });

  test(...tc("PRF-005", "Gagal menyimpan profil menampilkan alert & tetap di halaman", {
    feature: F_PRF, type: "Negative",
    input: "PUT /users/me/profile/update → 500",
    expected: "Alert 'Gagal menyimpan perubahan.', tetap di /setting/profile",
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    api.on("PUT", "/users/me/profile/update", { status: 500, json: {} });
    await page.goto("/setting/profile");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await dialogs.waitFor("Gagal menyimpan perubahan.");
    await expect(page).toHaveURL(/\/setting\/profile$/);
  });

  test(...tc("PRF-006", "Upload foto profil: >2MB ditolak, upload sukses memperbarui avatar", {
    feature: F_PRF, type: "E2E",
    input: "(a) gambar 2.5MB, (b) 'avatar.png' → ImgBB sukses url=https://i.ibb.co/x/avatar.png",
    expected: "(a) alert 'File terlalu besar (max 2MB)'; (b) PUT profil dengan foto_profil=url ImgBB, src avatar berubah",
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    let foto = null;
    api.on("GET", "/users/me/profile/full", () => ({ json: { ...USERS.client, foto_profil: foto } }));
    api.on("PUT", "/users/me/profile/update", (req) => { foto = multipartField(req.body, "foto_profil") || foto; return { json: { message: "ok" } }; });
    await page.route(/api\.imgbb\.com/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { url: "https://i.ibb.co/x/avatar.png" } }) }));
    await page.goto("/setting/profile");
    const file = page.locator('input[type="file"][accept="image/*"]');
    await file.setInputFiles({ name: "besar.png", mimeType: "image/png", buffer: Buffer.alloc(2.5 * 1024 * 1024) });
    await dialogs.waitFor("File terlalu besar (max 2MB)");
    await file.setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await expect(page.getByAltText("Profile")).toHaveAttribute("src", "https://i.ibb.co/x/avatar.png");
    expect(multipartField(api.calls("PUT", "/users/me/profile/update")[0].body, "foto_profil")).toBe("https://i.ibb.co/x/avatar.png");
  });

  test(...tc("PRF-007", "Upload foto gagal (ImgBB error) menampilkan alert", {
    feature: F_PRF, type: "Negative",
    input: "ImgBB mengembalikan {success:false}",
    expected: "Alert 'Gagal sinkronisasi foto.', tidak ada PUT profil",
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    await page.route(/api\.imgbb\.com/, (r) => r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ success: false }) }));
    await page.goto("/setting/profile");
    await page.locator('input[type="file"][accept="image/*"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await dialogs.waitFor("Gagal sinkronisasi foto.");
    expect(api.calls("PUT", "/users/me/profile/update")).toHaveLength(0);
  });

  test(...tc("PRF-008", "Konsultan yang ditolak melihat alasan penolakan di halaman profil", {
    feature: F_PRF, type: "Regression",
    input: "Profil status_verifikasi='ditolak', alasan='Foto KTP buram'",
    expected: "Kotak 'Pengajuan Verifikasi Ditolak' dengan alasan '\"Foto KTP buram\"'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("konsultan");
    api.on("GET", "/users/me/profile/full", { json: { ...USERS.konsultan, status_verifikasi: "ditolak", alasan_penolakan: "Foto KTP buram" } });
    await page.goto("/setting/profile");
    await expect(page.getByText("Pengajuan Verifikasi Ditolak")).toBeVisible();
    await expect(page.getByText('"Foto KTP buram"')).toBeVisible();
  });

  test(...tc("PRF-009", "Label field profil terhubung ke input (aksesibilitas)", {
    feature: F_PRF, type: "Accessibility",
    input: "Cari input dengan nama aksesibel 'Nama Lengkap' & 'Email'",
    expected: "getByLabel menemukan input yang tepat (label punya atribut for yang valid)",
  }), async ({ page, loginAs }) => {
    knownDefect("BUG-33");
    await loginAs("client");
    await page.goto("/setting/profile");
    await expect(page.getByLabel("Nama Lengkap")).toHaveValue("Budi Santoso", { timeout: 3000 });
    await expect(page.getByLabel("Email")).toHaveValue("budi.client@example.com");
  });
});

// ═══════════════════════════════════════════════════════════════ SECURITY
test.describe("Keamanan & Sandi @security", () => {
  test.beforeEach(async ({ loginAs }) => loginAs("client"));
  const newPw = (page) => page.getByLabel("Kata Sandi Baru", { exact: true });
  const confirmPw = (page) => page.getByLabel("Konfirmasi Kata Sandi Baru");
  const submit = (page) => page.getByRole("button", { name: "Simpan Kata Sandi" });

  test(...tc("SEC-001", "Ganti kata sandi sukses lalu diminta login ulang", {
    feature: F_SEC, type: "E2E",
    input: "Sandi baru 'SandiBaru123' (cocok)",
    expected: "POST /auth/reset-password {new_password:'SandiBaru123'}, alert sukses, redirect /auth/login",
    tags: ["@smoke"],
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/auth/reset-password", { json: { data: { updated: true } } });
    await page.goto("/setting/security");
    await newPw(page).fill("SandiBaru123");
    await confirmPw(page).fill("SandiBaru123");
    await submit(page).click();
    await dialogs.waitFor("Kata sandi berhasil diperbarui!");
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(api.calls("POST", "/auth/reset-password")[0].body).toEqual({ new_password: "SandiBaru123" });
  });

  test(...tc("SEC-002", "Konfirmasi sandi tidak cocok ditolak", {
    feature: F_SEC, type: "Negative",
    input: "'SandiBaru123' vs 'SandiBaru124'",
    expected: "Alert 'Konfirmasi password baru tidak cocok.', tidak ada request",
  }), async ({ page, api, dialogs }) => {
    await page.goto("/setting/security");
    await newPw(page).fill("SandiBaru123");
    await confirmPw(page).fill("SandiBaru124");
    await submit(page).click();
    await dialogs.waitFor("Konfirmasi password baru tidak cocok.");
    expect(api.calls("POST", "/auth/reset-password")).toHaveLength(0);
  });

  test(...tc("SEC-003", "Aturan panjang minimal kata sandi konsisten", {
    feature: F_SEC, type: "Regression",
    input: "Bandingkan atribut minLength input, placeholder, dan validasi JS (pesan 'minimal 6 karakter')",
    expected: "Satu aturan yang sama (mis. min 8) dipakai di placeholder, atribut HTML & pesan validasi",
  }), async ({ page }) => {
    knownDefect("BUG-23");
    await page.goto("/setting/security");
    const minLength = await newPw(page).getAttribute("minlength");
    const ph = await newPw(page).getAttribute("placeholder");
    expect(ph).toContain(minLength);
    // Validasi JS memakai batas 6: isi 6 karakter yang lolos JS namun ditolak HTML (minLength 8)
    await newPw(page).fill("abc123");
    await confirmPw(page).fill("abc123");
    const htmlValid = await newPw(page).evaluate((el) => el.checkValidity());
    expect(htmlValid, "6 karakter diterima oleh pesan JS 'minimal 6' tetapi ditolak minLength=8").toBe(true);
  });

  test(...tc("SEC-004", "Mengganti sandi mensyaratkan kata sandi saat ini", {
    feature: F_SEC, type: "Security",
    input: "Buka /setting/security",
    expected: "Terdapat field 'Kata Sandi Saat Ini' yang diverifikasi server sebelum sandi diganti (mencegah pengambilalihan akun dari sesi yang tertinggal)",
  }), async ({ page }) => {
    knownDefect("BUG-22");
    await page.goto("/setting/security");
    await expect(page.getByLabel(/Kata Sandi Saat Ini|Password Lama/)).toBeVisible({ timeout: 3000 });
  });

  test(...tc("SEC-005", "Gagal mengganti sandi (sesi kedaluwarsa) menampilkan pesan", {
    feature: F_SEC, type: "Negative",
    input: "POST /auth/reset-password → 401 detail='Sesi berakhir'",
    expected: "Alert berisi pesan error, tetap di halaman keamanan",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/auth/reset-password", { status: 400, json: { detail: "New password should be different from the old password." } });
    await page.goto("/setting/security");
    await newPw(page).fill("SandiBaru123");
    await confirmPw(page).fill("SandiBaru123");
    await submit(page).click();
    await dialogs.waitFor("New password should be different from the old password.");
    await expect(page).toHaveURL(/\/setting\/security$/);
  });

  test(...tc("SEC-006", "Sesi lokal dihapus setelah kata sandi diganti", {
    feature: F_SEC, type: "Security",
    input: "Ganti sandi sukses → periksa localStorage",
    expected: "Token ll_token/refresh dihapus sehingga user benar-benar harus login ulang",
  }), async ({ page, api, dialogs }) => {
    knownDefect("BUG-34");
    api.on("POST", "/auth/reset-password", { json: { data: { updated: true } } });
    await page.goto("/setting/security");
    await newPw(page).fill("SandiBaru123");
    await confirmPw(page).fill("SandiBaru123");
    await submit(page).click();
    await dialogs.waitFor("Kata sandi berhasil diperbarui!");
    await expect(page).toHaveURL(/\/auth\/login$/);
    expect(await page.evaluate(() => localStorage.getItem("ll_token"))).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════ LANGUAGE & ABOUT
test.describe("Bahasa & Tentang @settings", () => {
  test.beforeEach(async ({ loginAs }) => loginAs("client"));

  test(...tc("LNG-001", "Memilih bahasa English tersimpan & diterapkan", {
    feature: F_LNG, type: "E2E",
    input: "Pilih 'English' → 'Simpan Pengaturan' → buka lagi /setting/language",
    expected: "Pilihan English tetap aktif setelah dibuka ulang / UI berganti bahasa",
  }), async ({ page }) => {
    knownDefect("BUG-25");
    await page.goto("/setting");
    await page.goto("/setting/language");
    await page.getByRole("button", { name: /English/ }).click();
    await page.getByRole("button", { name: "Simpan Pengaturan" }).click();
    await expect(page).toHaveURL(/\/setting$/, { timeout: 5000 });
    await page.goto("/setting/language");
    await expect(page.getByRole("button", { name: /English/ })).toHaveClass(/bg-primary\/10/, { timeout: 3000 });
  });

  test(...tc("ABT-001", "Halaman Tentang LangkahLegal di pengaturan dapat dibuka", {
    feature: F_ABT, type: "E2E",
    input: "Buka /setting/about",
    expected: "Header 'Tentang LangkahLegal' & hero 'Mendigitalisasi akses hukum' tampil",
  }), async ({ page }) => {
    await page.goto("/setting/about");
    await expect(page.getByRole("heading", { name: "Tentang LangkahLegal" })).toBeVisible();
    await expect(page.getByText(/Mendigitalisasi/)).toBeVisible();
  });
});
