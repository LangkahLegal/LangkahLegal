/**
 * F13 Dashboard Client, F14 Katalog Konsultan (Explore), F15 Detail Konsultan & Booking.
 */
import { test, expect, tc, knownDefect, expectNoCrash } from "../support/fixtures.js";
import { multipartField, multipartFilenames } from "../support/mock-api.js";
import { CATALOG, clientConsultation, consultantDetail, dateFromToday } from "../support/mock-data.js";

const F_DASH = "F13 Dashboard Client";
const F_EXPLORE = "F14 Katalog Konsultan (Explore)";
const F_BOOK = "F15 Detail Konsultan & Booking";

/** Pilih tanggal tersedia pertama + jam mulai pada SchedulePicker. */
async function pickDateAndTime(page, start = "09:00") {
  await page.locator('button[class*="!w-16"]:not([disabled])').first().click();
  await page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) }).locator("div.cursor-pointer").first().click();
  await page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${start}`) }).click();
}

// ═══════════════════════════════════════════════════════════════ DASHBOARD CLIENT
test.describe("Dashboard Client @client", () => {
  test(...tc("CLI-001", "Dashboard client menampilkan sapaan, layanan unggulan & kartu kosong", {
    feature: F_DASH, type: "E2E",
    input: "Sesi client, GET /consultations/ → []",
    expected: "Nama 'Budi Santoso', kartu 'Belum Ada Konsultasi Aktif', layanan 'Tanya AI Langkah', 'Eksplorasi Konsultan', 'Ajukan Kasus Anonim'",
    tags: ["@smoke", "@mobile"],
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/dashboard/client");
    await expect(page.getByRole("heading", { name: "Budi Santoso" })).toBeVisible();
    await expect(page.getByText("Belum Ada Konsultasi Aktif")).toBeVisible();
    for (const s of ["Tanya AI Langkah", "Eksplorasi Konsultan", "Ajukan Kasus Anonim"]) await expect(page.getByText(s)).toBeVisible();
    await expectNoCrash(page);
  });

  test(...tc("CLI-002", "Tombol 'Cari Konsultan' pada kartu kosong membuka katalog", {
    feature: F_DASH, type: "E2E",
    input: "Klik 'Cari Konsultan' pada kartu 'Belum Ada Konsultasi Aktif'",
    expected: "Diarahkan ke halaman katalog /explore",
  }), async ({ page, loginAs }) => {
    knownDefect("BUG-10");
    await loginAs("client");
    await page.goto("/dashboard/client");
    await page.getByRole("link", { name: /Cari Konsultan/ }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test(...tc("CLI-003", "Kartu konsultasi aktif menampilkan pengajuan terbaru & status", {
    feature: F_DASH, type: "Regression",
    input: "2 pengajuan: pending (terbaru) & selesai (lama)",
    expected: "Hanya pengajuan pending (terbaru) yang tampil dengan label 'Pending' dan nama konsultan",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/", {
      json: { data: [
        clientConsultation({ id_pengajuan: 1, status_pengajuan: "selesai", created_at: "2024-01-01T00:00:00Z", jadwal_ketersediaan: { tanggal: "2024-01-05", konsultan: { nama_lengkap: "Konsultan Lama" } } }),
        clientConsultation({ id_pengajuan: 2, status_pengajuan: "pending" }),
      ] },
    });
    await page.goto("/dashboard/client");
    await expect(page.getByText("Siti Rahma, S.H., M.H.")).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
    await expect(page.getByText("Konsultan Lama")).toHaveCount(0);
  });

  test(...tc("CLI-004", "Membatalkan konsultasi pending lewat menu kartu", {
    feature: F_DASH, type: "E2E",
    input: "Menu ⋮ → 'BATALKAN' → konfirmasi OK",
    expected: "PUT /consultations/501/status?new_status=dibatalkan, alert 'Konsultasi berhasil dibatalkan.'",
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/", { json: { data: [clientConsultation()] } });
    api.on("PUT", "/consultations/501/status", { json: { message: "ok" } });
    await page.goto("/dashboard/client");
    await page.getByRole("button", { name: "more_vert" }).click();
    await page.getByRole("button", { name: /BATALKAN/ }).click();
    await dialogs.waitFor("Konsultasi berhasil dibatalkan.");
    const req = api.calls("PUT", "/consultations/501/status")[0];
    expect(req.query).toEqual({ new_status: "dibatalkan" });
    expect(dialogs.messages[0]).toEqual({ type: "confirm", message: "Apakah Anda yakin ingin membatalkan konsultasi ini?" });
  });

  test(...tc("CLI-005", "Batal membatalkan (confirm=Cancel) tidak memanggil API", {
    feature: F_DASH, type: "Negative",
    input: "Menu ⋮ → 'BATALKAN' → konfirmasi Cancel",
    expected: "Tidak ada request PUT status",
  }), async ({ page, api, loginAs, dialogs }) => {
    dialogs.confirmResult = false;
    await loginAs("client");
    api.on("GET", "/consultations/", { json: { data: [clientConsultation()] } });
    await page.goto("/dashboard/client");
    await page.getByRole("button", { name: "more_vert" }).click();
    await page.getByRole("button", { name: /BATALKAN/ }).click();
    await page.waitForTimeout(500);
    expect(api.calls("PUT", /\/status$/)).toHaveLength(0);
  });

  test(...tc("CLI-006", "Kartu 'Menunggu Pembayaran' mengarahkan ke halaman pembayaran", {
    feature: F_DASH, type: "E2E",
    input: "Pengajuan status=menunggu_pembayaran, klik 'Lanjut Pembayaran'",
    expected: "Redirect ke /payment/501",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/", { json: { data: [clientConsultation({ status_pengajuan: "menunggu_pembayaran" })] } });
    await page.goto("/dashboard/client");
    await page.getByRole("button", { name: /Lanjut Pembayaran/ }).click();
    await expect(page).toHaveURL(/\/payment\/501$/);
  });

  test(...tc("CLI-007", "Kartu 'Ditolak' yang disembunyikan tetap tersembunyi setelah reload", {
    feature: F_DASH, type: "Regression",
    input: "Pengajuan status=ditolak → menu ⋮ → 'HAPUS' → reload halaman",
    expected: "ID tersimpan di localStorage hidden_rejected_ids, kartu kosong tampil setelah reload",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/", { json: { data: [clientConsultation({ status_pengajuan: "ditolak" })] } });
    await page.goto("/dashboard/client");
    await expect(page.getByText("Ditolak", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "more_vert" }).click();
    await page.getByRole("button", { name: /HAPUS/ }).click();
    await expect(page.getByText("Belum Ada Konsultasi Aktif")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Belum Ada Konsultasi Aktif")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("hidden_rejected_ids"))).toBe("[501]");
  });

  test(...tc("CLI-008", "Data localStorage rusak tidak membuat dashboard crash", {
    feature: F_DASH, type: "Edge Case",
    input: "localStorage hidden_rejected_ids='{rusak' lalu buka dashboard dengan 1 pengajuan",
    expected: "Dashboard tetap tampil (data rusak diabaikan), tidak ada 'Application error'",
  }), async ({ page, api, loginAs, pageErrors }) => {
    knownDefect("BUG-29");
    await loginAs("client");
    await page.addInitScript(() => localStorage.setItem("hidden_rejected_ids", "{rusak"));
    api.on("GET", "/consultations/", { json: { data: [clientConsultation()] } });
    await page.goto("/dashboard/client");
    await expect(page.getByText("Siti Rahma, S.H., M.H.")).toBeVisible({ timeout: 5000 });
    expect(pageErrors).toEqual([]);
  });

  test(...tc("CLI-009", "Gagal memuat konsultasi (500) menampilkan pesan error, bukan kartu kosong", {
    feature: F_DASH, type: "Negative",
    input: "GET /consultations/ → 500",
    expected: "Pesan error/coba lagi tampil; tidak menampilkan 'Belum Ada Konsultasi Aktif' yang menyesatkan",
  }), async ({ page, api, loginAs }) => {
    knownDefect("BUG-18");
    await loginAs("client");
    api.on("GET", "/consultations/", { status: 500, json: { detail: "DB down" } });
    await page.goto("/dashboard/client");
    await expect(page.getByText(/gagal|error|coba lagi/i).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText("Belum Ada Konsultasi Aktif")).toHaveCount(0);
  });

  test(...tc("CLI-010", "Navigasi layanan unggulan & tombol pengaturan", {
    feature: F_DASH, type: "E2E",
    input: "Klik 'Eksplorasi Konsultan', kembali, klik ikon Settings",
    expected: "Masing-masing menuju /explore dan /setting",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/dashboard/client");
    await page.getByText("Eksplorasi Konsultan").click();
    await expect(page).toHaveURL(/\/explore$/);
    await page.goto("/dashboard/client");
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/setting$/);
  });

  test(...tc("CLI-011", "Bottom navigation tampil di mobile dan berfungsi", {
    feature: F_DASH, type: "Regression",
    input: "Viewport mobile, klik 'Riwayat' di bottom nav",
    expected: "Bottom nav berisi Konsultasi/Bursa/Tanya AI/Riwayat; klik Riwayat menuju /history/client",
    tags: ["@mobile"],
  }), async ({ page, loginAs }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Khusus viewport mobile");
    await loginAs("client");
    await page.goto("/dashboard/client");
    const nav = page.locator("footer").filter({ hasText: "Riwayat" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: /Riwayat/ }).click();
    await expect(page).toHaveURL(/\/history\/client$/);
  });
});

// ═══════════════════════════════════════════════════════════════ EXPLORE
test.describe("Katalog Konsultan @explore", () => {
  const cards = (page) => page.getByTestId("consultant-card");

  test(...tc("EXP-001", "Katalog menampilkan semua konsultan aktif beserta harga & badge", {
    feature: F_EXPLORE, type: "E2E",
    input: "GET /consultants/ → 4 konsultan",
    expected: "4 kartu; tarif 'Rp 150.000', 'Gratis' untuk tarif 0; rating & jumlah ulasan tampil",
    tags: ["@smoke", "@mobile"],
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/explore");
    await expect(cards(page)).toHaveCount(4);
    await expect(page.getByText("Rp 150.000")).toBeVisible();
    await expect(page.getByText("Gratis")).toBeVisible();
    await expect(page.getByText("(12 Ulasan)")).toBeVisible();
  });

  test(...tc("EXP-002", "Pencarian nama bersifat case-insensitive", {
    feature: F_EXPLORE, type: "E2E",
    input: "Ketik 'siti' lalu 'ANDI'",
    expected: "Masing-masing hanya 1 kartu yang cocok",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/explore");
    const search = page.getByTestId("explore-search-input");
    await search.fill("siti");
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Siti Rahma");
    await search.fill("ANDI");
    await expect(cards(page)).toHaveCount(1);
  });

  test(...tc("EXP-003", "Pencarian berdasarkan keahlian sesuai placeholder", {
    feature: F_EXPLORE, type: "E2E",
    input: "Placeholder 'Cari keahlian atau nama...', ketik 'Pidana'",
    expected: "Konsultan dengan spesialisasi Pidana (Andi Wijaya, Dewi Lestari) tampil",
  }), async ({ page, loginAs }) => {
    knownDefect("BUG-17");
    await loginAs("client");
    await page.goto("/explore");
    await page.getByTestId("explore-search-input").fill("Pidana");
    await expect(cards(page)).toHaveCount(2);
  });

  test(...tc("EXP-004", "Pencarian tanpa hasil menampilkan empty state", {
    feature: F_EXPLORE, type: "Negative",
    input: "Ketik 'zzzz-tidak-ada'",
    expected: "0 kartu dan teks 'Tidak Ditemukan'",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/explore");
    await page.getByTestId("explore-search-input").fill("zzzz-tidak-ada");
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByText("Tidak Ditemukan")).toBeVisible();
  });

  test(...tc("EXP-005", "Input pencarian ekstrem (500 karakter, XSS, SQL, emoji) tidak merusak halaman", {
    feature: F_EXPLORE, type: "Edge Case",
    input: "'A'×500, '<script>alert(1)</script>', \"' OR 1=1 --\", '测试 🚀'",
    expected: "Tidak ada dialog/eksekusi script, tidak crash, empty state tampil",
  }), async ({ page, loginAs, dialogs }) => {
    await loginAs("client");
    await page.goto("/explore");
    const search = page.getByTestId("explore-search-input");
    for (const v of ["A".repeat(500), "<script>alert(1)</script>", "' OR 1=1 --", "测试 🚀"]) {
      await search.fill(v);
      await expect(page.getByText("Tidak Ditemukan")).toBeVisible();
    }
    expect(dialogs.messages).toHaveLength(0);
    await expectNoCrash(page);
  });

  test(...tc("EXP-006", "Filter kategori memanggil API dengan parameter spesialisasi", {
    feature: F_EXPLORE, type: "Regression",
    input: "Dropdown kategori → 'Pidana'",
    expected: "GET /consultants/?spesialisasi=pidana dan hanya hasil API tersebut yang tampil",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultants/", (req) => ({
      json: { data: req.query.spesialisasi === "pidana" ? CATALOG.filter((c) => /Pidana/.test(c.spec)) : CATALOG },
    }));
    await page.goto("/explore");
    await expect(cards(page)).toHaveCount(4);
    await page.getByRole("button", { name: /^Semua/ }).first().click();
    await page.locator("div.cursor-pointer", { hasText: /^Pidana$/ }).click();
    await expect(cards(page)).toHaveCount(2);
    expect(api.calls("GET", "/consultants/").some((r) => r.query.spesialisasi === "pidana")).toBe(true);
  });

  test(...tc("EXP-007", "Filter status verifikasi & rentang harga, lalu reset", {
    feature: F_EXPLORE, type: "E2E",
    input: "Verified → harga min 100000 max 200000 → Reset",
    expected: "Verified: 2 kartu; + harga: 1 kartu (Siti); setelah Reset: 4 kartu & tombol Reset nonaktif",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/explore");
    const reset = page.getByRole("button", { name: "Reset" });
    await expect(reset).toBeDisabled();
    await page.getByRole("button", { name: /^Semua/ }).nth(1).click();
    await page.locator("div.cursor-pointer", { hasText: /^Verified$/ }).click();
    await expect(cards(page)).toHaveCount(2);
    await page.getByPlaceholder("Min").fill("100000");
    await page.getByPlaceholder("Max").fill("200000");
    await expect(cards(page)).toHaveCount(1);
    await expect(reset).toBeEnabled();
    await reset.click();
    await expect(cards(page)).toHaveCount(4);
    await expect(reset).toBeDisabled();
  });

  test(...tc("EXP-008", "Rentang harga terbalik (min > max) & nilai negatif", {
    feature: F_EXPLORE, type: "Edge Case",
    input: "min=500000, max=100000; lalu min=-1",
    expected: "Min>max menghasilkan empty state tanpa crash; min negatif diperlakukan seperti tanpa batas bawah",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/explore");
    await page.getByPlaceholder("Min").fill("500000");
    await page.getByPlaceholder("Max").fill("100000");
    await expect(page.getByText("Tidak Ditemukan")).toBeVisible();
    await page.getByPlaceholder("Max").fill("");
    await page.getByPlaceholder("Min").fill("-1");
    await expect(cards(page)).toHaveCount(4);
  });

  test(...tc("EXP-009", "URL foto berbahaya (javascript:) tidak dipakai sebagai src gambar", {
    feature: F_EXPLORE, type: "Security",
    input: "Konsultan 'Clara' dengan foto_profil='javascript:alert(1)'",
    expected: "src <img> memakai fallback ui-avatars, bukan 'javascript:'",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/explore");
    const img = cards(page).filter({ hasText: "Clara Hutapea" }).locator("img");
    await expect(img).toHaveAttribute("src", /ui-avatars\.com/);
  });

  test(...tc("EXP-010", "Konsultan dengan nama null tidak membuat katalog crash", {
    feature: F_EXPLORE, type: "Edge Case",
    input: "GET /consultants/ berisi item {name:null} (profil konsultan belum lengkap)",
    expected: "Katalog tetap tampil (kartu lain terlihat), tidak ada 'Application error'",
  }), async ({ page, api, loginAs, pageErrors }) => {
    knownDefect("BUG-11");
    await loginAs("client");
    api.on("GET", "/consultants/", { json: { data: [...CATALOG, { ...CATALOG[0], id: 99, name: null }] } });
    await page.goto("/explore");
    await expect(cards(page).first()).toBeVisible({ timeout: 5000 });
    expect(pageErrors).toEqual([]);
  });

  test(...tc("EXP-011", "Gagal memuat katalog (500) menampilkan pesan error yang jelas", {
    feature: F_EXPLORE, type: "Negative",
    input: "GET /consultants/ → 500",
    expected: "Pesan error/coba lagi, bukan 'Tidak Ditemukan' yang menyesatkan",
  }), async ({ page, api, loginAs }) => {
    knownDefect("BUG-18");
    await loginAs("client");
    api.on("GET", "/consultants/", { status: 500, json: { detail: "boom" } });
    await page.goto("/explore");
    await expect(page.getByText(/gagal|error|coba lagi/i).first()).toBeVisible({ timeout: 6000 });
  });

  test(...tc("EXP-012", "Tombol 'Lihat' membuka halaman detail konsultan", {
    feature: F_EXPLORE, type: "E2E",
    input: "Klik 'Lihat' pada kartu Siti Rahma",
    expected: "Menuju /explore/10",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultants/10", { json: { data: consultantDetail() } });
    api.on("GET", "/consultations/10/booked-slots", { json: { data: [] } });
    await page.goto("/explore");
    await cards(page).filter({ hasText: "Siti Rahma" }).getByRole("link", { name: "Lihat" }).click();
    await expect(page).toHaveURL(/\/explore\/10$/);
  });
});

// ═══════════════════════════════════════════════════════════════ DETAIL & BOOKING
test.describe("Detail Konsultan & Booking @booking", () => {
  test.beforeEach(async ({ api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultants/10", { json: { data: consultantDetail() } });
    api.on("GET", "/consultations/10/booked-slots", { json: { data: [] } });
  });

  test(...tc("BOK-001", "Profil konsultan menampilkan nama, badge, harga, deskripsi & tag", {
    feature: F_BOOK, type: "E2E",
    input: "Buka /explore/10",
    expected: "Nama, '✅ Verified', 'Rp 150.000', deskripsi, tag 'Perdata' & 'Waris'",
    tags: ["@mobile"],
  }), async ({ page }) => {
    await page.goto("/explore/10");
    await expect(page.getByRole("heading", { name: "Siti Rahma, S.H., M.H." })).toBeVisible();
    await expect(page.getByText("✅ Verified")).toBeVisible();
    await expect(page.getByText("Rp 150.000")).toBeVisible();
    await expect(page.getByText("Berpengalaman menangani sengketa tanah")).toBeVisible();
    await expect(page.getByText("Waris", { exact: true })).toBeVisible();
  });

  test(...tc("BOK-002", "Booking konsultasi sukses dengan dokumen pendukung", {
    feature: F_BOOK, type: "E2E",
    input: `tanggal=${dateFromToday(2)}, jam 09:00–09:30, deskripsi kasus, 1 file PDF 'bukti.pdf'`,
    expected: "POST /consultations/ multipart {id_jadwal:101, deskripsi_kasus, tanggal_pengajuan, jam_mulai:'09:00:00', jam_selesai:'09:30:00', dokumen_pendukung_files:bukti.pdf} → layar 'Permintaan Booking Berhasil Terkirim!' → kembali ke dashboard",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("POST", "/consultations/", { status: 201, json: { data: { id_pengajuan: 900 } } });
    await page.goto("/explore/10");
    await pickDateAndTime(page, "09:00");
    await expect(page.getByText("09:30")).toBeVisible();
    await page.getByPlaceholder("Ceritakan detail permasalahan hukum Anda di sini...").fill("Sengketa batas tanah dengan tetangga.");
    await page.locator('input[type="file"]').setInputFiles({ name: "bukti.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
    await expect(page.getByText("bukti.pdf")).toBeVisible();
    await expect(page.getByText("1 Files")).toBeVisible();
    await page.getByRole("button", { name: "Booking Konsultasi" }).click();
    await expect(page.getByText("Permintaan Booking Berhasil Terkirim!")).toBeVisible();
    const body = api.calls("POST", "/consultations/")[0].body;
    expect(multipartField(body, "id_jadwal")).toBe("101");
    expect(multipartField(body, "tanggal_pengajuan")).toBe(dateFromToday(2));
    expect(multipartField(body, "jam_mulai")).toBe("09:00:00");
    expect(multipartField(body, "jam_selesai")).toBe("09:30:00");
    expect(multipartField(body, "deskripsi_kasus")).toBe("Sengketa batas tanah dengan tetangga.");
    expect(multipartFilenames(body, "dokumen_pendukung_files")).toEqual(["bukti.pdf"]);
    await page.getByRole("button", { name: "Kembali ke Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard\/client$/);
  });

  test(...tc("BOK-003", "Booking dengan data belum lengkap ditolak di sisi klien", {
    feature: F_BOOK, type: "Negative",
    input: "(a) tanpa memilih apa pun, (b) tanggal+jam dipilih tapi deskripsi hanya spasi",
    expected: "Alert 'Mohon lengkapi semua data pengajuan.' 2x dan tidak ada POST /consultations/",
  }), async ({ page, api, dialogs }) => {
    await page.goto("/explore/10");
    await page.getByRole("button", { name: "Booking Konsultasi" }).click();
    await dialogs.waitFor("Mohon lengkapi semua data pengajuan.");
    await pickDateAndTime(page, "10:00");
    await page.getByPlaceholder("Ceritakan detail permasalahan hukum Anda di sini...").fill("    ");
    await page.getByRole("button", { name: "Booking Konsultasi" }).click();
    await expect.poll(() => dialogs.messages.length).toBe(2);
    expect(api.calls("POST", "/consultations/")).toHaveLength(0);
  });

  test(...tc("BOK-004", "Slot yang sudah dipesan ditandai 'Terisi' & tidak bisa dipilih", {
    feature: F_BOOK, type: "Regression",
    input: `booked-slots: ${dateFromToday(2)} 09:00–10:00 (terjadwal)`,
    expected: "Opsi 09:00 & 09:30 berlabel 'Terisi'; klik tidak mengubah jam mulai (tetap '--:--')",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/10/booked-slots", {
      json: { data: [{ tanggal_pengajuan: dateFromToday(2), jam_mulai: "09:00:00", jam_selesai: "10:00:00" }] },
    });
    await page.goto("/explore/10");
    await page.locator('button[class*="!w-16"]:not([disabled])').first().click();
    const trigger = page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) }).locator("div.cursor-pointer").first();
    await trigger.click();
    const slot = page.locator(".max-h-60 > div").filter({ hasText: /^09:00/ });
    await expect(slot).toContainText("Terisi");
    await slot.click({ force: true });
    await expect(trigger).toContainText("--:--");
  });

  test(...tc("BOK-005", "Jam di luar jam operasional konsultan tidak dapat dipilih", {
    feature: F_BOOK, type: "Edge Case",
    input: "Jadwal 08:00–17:00; buka dropdown jam mulai",
    expected: "07:30 dan 17:00 nonaktif (opacity), 08:00 dan 16:30 aktif",
  }), async ({ page }) => {
    await page.goto("/explore/10");
    await page.locator('button[class*="!w-16"]:not([disabled])').first().click();
    await page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) }).locator("div.cursor-pointer").first().click();
    const opt = (t) => page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${t}`) });
    await expect(opt("07:30")).toHaveClass(/cursor-not-allowed/);
    await expect(opt("17:00")).toHaveClass(/cursor-not-allowed/);
    await expect(opt("08:00")).not.toHaveClass(/cursor-not-allowed/);
    await expect(opt("16:30")).not.toHaveClass(/cursor-not-allowed/);
  });

  test(...tc("BOK-006", "Konsultan tanpa jadwal: semua tanggal nonaktif", {
    feature: F_BOOK, type: "Edge Case",
    input: "jadwal_ketersediaan=[]",
    expected: "Tidak ada tombol tanggal yang aktif",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/10", { json: { data: consultantDetail({ jadwal_ketersediaan: [] }) } });
    await page.goto("/explore/10");
    await expect(page.getByText("Pilih Jadwal Sesi")).toBeVisible();
    await expect(page.locator('button[class*="!w-16"]:not([disabled])')).toHaveCount(0);
  });

  test(...tc("BOK-007", "Upload file > 10MB ditolak dan file dapat dihapus dari daftar", {
    feature: F_BOOK, type: "Negative",
    input: "(a) file 10.5MB, (b) file 'akta.pdf' lalu 'Hapus Berkas'",
    expected: "(a) alert 'File terlalu besar! Maksimal 10MB', tidak masuk daftar; (b) daftar kembali kosong",
  }), async ({ page, dialogs }) => {
    await page.goto("/explore/10");
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({ name: "besar.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(10.5 * 1024 * 1024) });
    await dialogs.waitFor("File terlalu besar! Maksimal 10MB");
    await expect(page.getByText("besar.pdf")).toHaveCount(0);
    await input.setInputFiles({ name: "akta.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await expect(page.getByText("akta.pdf")).toBeVisible();
    await page.getByText("akta.pdf").locator("xpath=ancestor::div[contains(@class,'relative')][1]").getByRole("button", { name: "more_vert" }).click();
    await page.getByRole("button", { name: /Hapus Berkas/ }).click();
    await expect(page.getByText("akta.pdf")).toHaveCount(0);
  });

  test(...tc("BOK-008", "File dengan tipe tidak diizinkan (.exe) ditolak", {
    feature: F_BOOK, type: "Security",
    input: "Unggah 'malware.exe' (application/x-msdownload) via drag-drop/input",
    expected: "File ditolak dengan pesan tipe tidak didukung; tidak masuk daftar dokumen",
  }), async ({ page }) => {
    knownDefect("BUG-12");
    await page.goto("/explore/10");
    await page.locator('input[type="file"]').setInputFiles({ name: "malware.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    await page.waitForTimeout(500);
    await expect(page.getByText("malware.exe")).toHaveCount(0);
  });

  test(...tc("BOK-009", "Error backend saat booking ditampilkan ke user", {
    feature: F_BOOK, type: "Negative",
    input: "POST /consultations/ → 400 detail='Jadwal sudah terisi'",
    expected: "Alert 'Jadwal sudah terisi', tetap di form (tidak ke layar sukses)",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/consultations/", { status: 400, json: { detail: "Jadwal sudah terisi" } });
    await page.goto("/explore/10");
    await pickDateAndTime(page, "11:00");
    await page.getByPlaceholder("Ceritakan detail permasalahan hukum Anda di sini...").fill("Kasus waris");
    await page.getByRole("button", { name: "Booking Konsultasi" }).click();
    await dialogs.waitFor("Jadwal sudah terisi");
    await expect(page.getByText("Permintaan Booking Berhasil Terkirim!")).toHaveCount(0);
  });

  test(...tc("BOK-010", "Tombol booking terkunci saat request berjalan (anti double-booking)", {
    feature: F_BOOK, type: "Edge Case",
    input: "Klik 'Booking Konsultasi' 2x cepat, response delay 1.5s",
    expected: "Hanya 1 POST /consultations/ terkirim",
  }), async ({ page, api }) => {
    api.on("POST", "/consultations/", { delay: 1500, status: 201, json: { data: {} } });
    await page.goto("/explore/10");
    await pickDateAndTime(page, "13:00");
    await page.getByPlaceholder("Ceritakan detail permasalahan hukum Anda di sini...").fill("Kasus");
    const btn = page.getByRole("button", { name: "Booking Konsultasi" });
    await btn.click();
    await page.getByRole("button", { name: /Memproses/ }).click({ force: true, timeout: 1000 }).catch(() => {});
    await expect(page.getByText("Permintaan Booking Berhasil Terkirim!")).toBeVisible();
    expect(api.calls("POST", "/consultations/")).toHaveLength(1);
  });

  test(...tc("BOK-011", "ID konsultan tidak ditemukan (404) menampilkan state 'tidak ditemukan'", {
    feature: F_BOOK, type: "Negative",
    input: "Buka /explore/99999 → GET /consultants/99999 404",
    expected: "Pesan konsultan tidak ditemukan; form booking tidak ditampilkan",
  }), async ({ page, api }) => {
    knownDefect("BUG-19");
    api.on("GET", "/consultants/99999", { status: 404, json: { detail: "Konsultan tidak ditemukan" } });
    api.on("GET", "/consultations/99999/booked-slots", { json: { data: [] } });
    await page.goto("/explore/99999");
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("button", { name: "Booking Konsultasi" })).toHaveCount(0);
  });
});
