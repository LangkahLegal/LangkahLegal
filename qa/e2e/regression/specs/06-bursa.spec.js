/**
 * F19 Posting Kasus Anonim (client) & F24 Bursa Kasus (konsultan: lihat, filter, klaim).
 */
import { test, expect, tc } from "../support/fixtures.js";
import { multipartField, multipartFilenames } from "../support/mock-api.js";
import { bursaCase, clientConsultation, dateFromToday } from "../support/mock-data.js";

const F_POST = "F19 Posting Kasus Anonim (Bursa)";
const F_BURSA = "F24 Bursa Kasus (Konsultan)";

/** Pilih tanggal besok pada SchedulePicker mode publik (menangani pergantian bulan). */
async function pickTomorrow(page) {
  const tomorrow = dateFromToday(1);
  const [, m, d] = tomorrow.split("-").map(Number);
  const today = dateFromToday(0);
  if (Number(today.split("-")[1]) !== m) {
    const monthName = new Date(2000, m - 1, 1).toLocaleDateString("id-ID", { month: "long" });
    await page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Bulan" }) }).locator("div.cursor-pointer").first().click();
    await page.locator(".max-h-52 > div").filter({ hasText: new RegExp(`^${monthName}`, "i") }).click();
  }
  await page.locator('button[class*="!w-16"]').filter({ hasText: new RegExp(`^\\D+${d}$`) }).click();
  return tomorrow;
}

async function pickStart(page, time) {
  await page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) }).locator("div.cursor-pointer").first().click();
  await page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${time}`) }).click();
}

// ═══════════════════════════════════════════════════════════════ POSTING KASUS (CLIENT)
test.describe("Posting Kasus Anonim @bursa", () => {
  test.beforeEach(async ({ loginAs }) => loginAs("client"));
  const desc = (page) => page.getByTestId("bursa-description-input");

  test(...tc("BPO-001", "Form posting kasus tampil dengan kategori default 'Umum' & info anonim", {
    feature: F_POST, type: "E2E",
    input: "Buka /bursa/post sebagai client",
    expected: "Judul 'Ajukan Kasus ke Ruang Publik', pilihan Umum/Pidana/Perdata, info 'secara anonim'",
    tags: ["@mobile"],
  }), async ({ page }) => {
    await page.goto("/bursa/post");
    await expect(page.getByTestId("bursa-post-page")).toBeVisible();
    await expect(page.getByText("Ajukan Kasus ke Ruang Publik")).toBeVisible();
    for (const k of ["Umum", "Pidana", "Perdata"]) await expect(page.getByRole("button", { name: k, exact: true })).toBeVisible();
    await expect(page.getByText("secara anonim")).toBeVisible();
  });

  test(...tc("BPO-002", "Posting kasus pidana lengkap dengan dokumen berhasil", {
    feature: F_POST, type: "E2E",
    input: "kategori=Pidana, deskripsi='   Saya ditipu penjual online   ', tanggal=besok, 10:00–10:30, file 'chat.png'",
    expected: "POST /cases/ multipart {kategori_hukum:'pidana', deskripsi_kasus_awam (di-trim), tanggal_konsultasi, jam_mulai:'10:00', jam_selesai:'10:30', dokumen_pendukung_files:'chat.png'} → layar sukses → dashboard client",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("POST", "/cases/", { status: 201, json: { data: { id_bursa: 800 } } });
    await page.goto("/bursa/post");
    await page.getByRole("button", { name: "Pidana", exact: true }).click();
    await desc(page).fill("   Saya ditipu penjual online   ");
    const tgl = await pickTomorrow(page);
    await pickStart(page, "10:00");
    await page.locator('input[type="file"]').setInputFiles({ name: "chat.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await page.getByTestId("bursa-post-submit-btn").click();
    await expect(page.getByText("Kasus Berhasil Diposting ke Ruang Publik!")).toBeVisible();
    const body = api.calls("POST", "/cases/")[0].body;
    expect(multipartField(body, "kategori_hukum")).toBe("pidana");
    expect(multipartField(body, "deskripsi_kasus_awam")).toBe("Saya ditipu penjual online");
    expect(multipartField(body, "tanggal_konsultasi")).toBe(tgl);
    expect(multipartField(body, "jam_mulai")).toBe("10:00");
    expect(multipartField(body, "jam_selesai")).toBe("10:30");
    expect(multipartFilenames(body, "dokumen_pendukung_files")).toEqual(["chat.png"]);
    await page.getByRole("button", { name: "Kembali ke Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard\/client$/);
  });

  test(...tc("BPO-003", "Posting dengan data belum lengkap ditolak", {
    feature: F_POST, type: "Negative",
    input: "(a) semua kosong, (b) deskripsi terisi tanpa tanggal/jam",
    expected: "Alert 'Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).' & tidak ada POST /cases/",
  }), async ({ page, api, dialogs }) => {
    await page.goto("/bursa/post");
    await page.getByTestId("bursa-post-submit-btn").click();
    await dialogs.waitFor("Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).");
    await desc(page).fill("Kasus warisan");
    await page.getByTestId("bursa-post-submit-btn").click();
    await expect.poll(() => dialogs.messages.length).toBe(2);
    expect(api.calls("POST", "/cases/")).toHaveLength(0);
  });

  test(...tc("BPO-004", "Error backend saat posting ditampilkan", {
    feature: F_POST, type: "Negative",
    input: "POST /cases/ → 403 'Hanya client yang dapat memposting kasus'",
    expected: "Alert berisi pesan backend, tetap di form",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/cases/", { status: 403, json: { detail: "Hanya client yang dapat memposting kasus" } });
    await page.goto("/bursa/post");
    await desc(page).fill("Kasus");
    await pickTomorrow(page);
    await pickStart(page, "14:00");
    await page.getByTestId("bursa-post-submit-btn").click();
    await dialogs.waitFor("Hanya client yang dapat memposting kasus");
    await expect(page.getByTestId("bursa-post-page")).toBeVisible();
  });

  test(...tc("BPO-005", "Slot yang bentrok dengan konsultasi milik sendiri ditandai 'Terisi'", {
    feature: F_POST, type: "Regression",
    input: "Client punya pengajuan pending besok 10:00–11:00",
    expected: "Opsi jam mulai 10:00 & 10:30 berlabel 'Terisi', 11:00 tersedia",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/", { json: { data: [clientConsultation({ tanggal_pengajuan: dateFromToday(1), jam_mulai: "10:00:00", jam_selesai: "11:00:00", jadwal_ketersediaan: null })] } });
    await page.goto("/bursa/post");
    await pickTomorrow(page);
    await page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) }).locator("div.cursor-pointer").first().click();
    const opt = (t) => page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${t}`) });
    await expect(opt("10:00")).toContainText("Terisi");
    await expect(opt("10:30")).toContainText("Terisi");
    await expect(opt("11:00")).not.toContainText("Terisi");
  });

  test(...tc("BPO-006", "Jam yang sudah lewat hari ini tidak dapat dipilih", {
    feature: F_POST, type: "Edge Case",
    input: "Jam browser diset 14:10 WIB, pilih tanggal hari ini lalu buka dropdown jam mulai",
    expected: "Opsi 14:00 nonaktif, 14:30 aktif",
  }), async ({ page }) => {
    const today = dateFromToday(0);
    await page.clock.setFixedTime(new Date(`${today}T14:10:00+07:00`));
    await page.goto("/bursa/post");
    const d = Number(today.split("-")[2]);
    await page.locator('button[class*="!w-16"]').filter({ hasText: new RegExp(`^\\D+${d}$`) }).click();
    await page.locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) }).locator("div.cursor-pointer").first().click();
    const opt = (t) => page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${t}`) });
    await expect(opt("14:00")).toHaveClass(/cursor-not-allowed/);
    await expect(opt("14:30")).not.toHaveClass(/cursor-not-allowed/);
  });

  test(...tc("BPO-007", "Maksimal 10 dokumen pendukung", {
    feature: F_POST, type: "Edge Case",
    input: "Unggah 11 file PDF satu per satu",
    expected: "10 file masuk daftar ('10 Files'), file ke-11 memunculkan alert 'Maksimal 10 file'",
  }), async ({ page, dialogs }) => {
    await page.goto("/bursa/post");
    const input = page.locator('input[type="file"]');
    for (let i = 1; i <= 11; i++) await input.setInputFiles({ name: `doc-${i}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await dialogs.waitFor("Maksimal 10 file");
    await expect(page.getByText("10 Files")).toBeVisible();
    await expect(page.getByText("doc-11.pdf")).toHaveCount(0);
  });
});

// ═══════════════════════════════════════════════════════════════ BURSA (KONSULTAN)
test.describe("Bursa Kasus Konsultan @bursa", () => {
  const cases = [
    bursaCase(),
    bursaCase({ id_bursa: 702, kategori_hukum: "perdata", deskripsi_kasus_awam: "Sengketa sewa rumah. ".repeat(12), dokumen_bukti: "https://example.com/kontrak.pdf" }),
    bursaCase({ id_bursa: 703, kategori_hukum: null, deskripsi_kasus_awam: '<img src=x onerror="alert(1)">Kasus umum tanpa kategori', tanggal_konsultasi: null }),
  ];
  test.beforeEach(async ({ api, loginAs }) => {
    await loginAs("konsultan");
    api.on("GET", "/cases/", { json: { data: cases } });
  });
  const card = (page) => page.getByTestId("bursa-card");

  test(...tc("BUR-001", "Daftar kasus open tampil dengan jumlah, kategori, waktu & jadwal", {
    feature: F_BURSA, type: "E2E",
    input: "GET /cases/ → 3 kasus",
    expected: "Badge '3 Kasus', 3 kartu 'Klien Anonim', label waktu '2 jam lalu', link 'Lihat Dokumen' untuk kasus berdokumen",
    tags: ["@smoke", "@mobile"],
  }), async ({ page }) => {
    await page.goto("/bursa");
    await expect(page.getByText("3 Kasus")).toBeVisible();
    await expect(card(page)).toHaveCount(3);
    await expect(card(page).first()).toContainText("Klien Anonim");
    await expect(card(page).first()).toContainText("2 jam lalu");
    await expect(page.getByRole("link", { name: /Lihat Dokumen/ })).toHaveAttribute("href", "https://example.com/kontrak.pdf");
  });

  test(...tc("BUR-002", "Filter kategori & kasus tanpa kategori diperlakukan sebagai 'Umum'", {
    feature: F_BURSA, type: "Regression",
    input: "Filter 'Pidana' → 'Umum' → 'Perdata' (data perdata dikosongkan)",
    expected: "Pidana: 1 kartu (701); Umum: 1 kartu (703, kategori null); Perdata kosong menampilkan 'Tidak ada kasus \"Perdata\"…'",
  }), async ({ page, api }) => {
    await page.goto("/bursa");
    await page.getByRole("button", { name: "Pidana", exact: true }).click();
    await expect(card(page)).toHaveCount(1);
    await expect(card(page).first()).toHaveAttribute("data-case-id", "701");
    await page.getByRole("button", { name: "Umum", exact: true }).click();
    await expect(card(page)).toHaveCount(1);
    await expect(card(page).first()).toHaveAttribute("data-case-id", "703");
    api.on("GET", "/cases/", { json: { data: [cases[0]] } });
    await page.reload();
    await page.getByRole("button", { name: "Perdata", exact: true }).click();
    await expect(page.getByText('Tidak ada kasus "Perdata" yang tersedia saat ini.')).toBeVisible();
  });

  test(...tc("BUR-003", "Deskripsi panjang bisa diperluas & diciutkan", {
    feature: F_BURSA, type: "E2E",
    input: "Kasus 702 dengan deskripsi > 150 karakter → 'Lihat Selengkapnya' → 'Sembunyikan'",
    expected: "Kelas line-clamp-3 hilang saat diperluas dan kembali saat diciutkan",
  }), async ({ page }) => {
    await page.goto("/bursa");
    const c = card(page).filter({ has: page.locator('[data-case-id="702"]') }).or(page.locator('[data-case-id="702"]'));
    const text = c.getByTestId("bursa-card-description");
    await expect(text).toHaveClass(/line-clamp-3/);
    await c.getByRole("button", { name: /Lihat Selengkapnya/ }).click();
    await expect(text).not.toHaveClass(/line-clamp-3/);
    await c.getByRole("button", { name: /Sembunyikan/ }).click();
    await expect(text).toHaveClass(/line-clamp-3/);
  });

  test(...tc("BUR-004", "Deskripsi berisi HTML/script dirender sebagai teks biasa", {
    feature: F_BURSA, type: "Security",
    input: "deskripsi_kasus_awam='<img src=x onerror=\"alert(1)\">Kasus umum…'",
    expected: "Teks mentah tampil, tidak ada elemen <img> injeksi, tidak ada dialog",
  }), async ({ page, dialogs }) => {
    await page.goto("/bursa");
    const c = page.locator('[data-case-id="703"]');
    await expect(c.getByTestId("bursa-card-description")).toContainText('<img src=x onerror="alert(1)">');
    await expect(c.locator("img")).toHaveCount(0);
    await page.waitForTimeout(300);
    expect(dialogs.messages).toHaveLength(0);
  });

  test(...tc("BUR-005", "Batal klaim menutup modal tanpa memanggil API", {
    feature: F_BURSA, type: "Negative",
    input: "Klik 'Klaim Kasus' → 'Batal'; lalu buka lagi → klik backdrop",
    expected: "Modal konfirmasi tertutup kedua kalinya; tidak ada POST /cases/*/claim",
  }), async ({ page, api }) => {
    await page.goto("/bursa");
    await card(page).first().getByTestId("bursa-claim-btn").click();
    await expect(page.getByTestId("bursa-claim-modal")).toBeVisible();
    await page.getByTestId("bursa-claim-cancel-btn").click();
    await expect(page.getByTestId("bursa-claim-modal")).toHaveCount(0);
    await card(page).first().getByTestId("bursa-claim-btn").click();
    await page.getByTestId("bursa-claim-modal").click({ position: { x: 5, y: 5 } });
    await expect(page.getByTestId("bursa-claim-modal")).toHaveCount(0);
    expect(api.calls("POST", /\/claim$/)).toHaveLength(0);
  });

  test(...tc("BUR-006", "Klaim kasus sukses → layar sukses → detail konsultasi", {
    feature: F_BURSA, type: "E2E",
    input: "Klaim kasus 701 → 'Ya, Klaim'; backend mengembalikan {data:{id_pengajuan:9001}}",
    expected: "POST /cases/701/claim, layar 'Kasus Berhasil Diklaim!', tombol 'Lihat Detail Konsultasi' → /consultation/9001",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("POST", "/cases/701/claim", { json: { message: "ok", data: { id_pengajuan: 9001 } } });
    await page.goto("/bursa");
    await page.locator('[data-case-id="701"]').getByTestId("bursa-claim-btn").click();
    await page.getByTestId("bursa-claim-confirm-btn").click();
    await expect(page.getByText("Kasus Berhasil Diklaim!")).toBeVisible();
    expect(api.calls("POST", "/cases/701/claim")).toHaveLength(1);
    await page.getByRole("button", { name: "Lihat Detail Konsultasi" }).click();
    await expect(page).toHaveURL(/\/consultation\/9001$/);
  });

  test(...tc("BUR-007", "Kembali ke bursa setelah klaim sukses", {
    feature: F_BURSA, type: "E2E",
    input: "Klaim sukses → klik 'Kembali ke Bursa'",
    expected: "Daftar bursa tampil kembali",
  }), async ({ page, api }) => {
    api.on("POST", "/cases/701/claim", { json: { data: { id_pengajuan: 9001 } } });
    await page.goto("/bursa");
    await page.locator('[data-case-id="701"]').getByTestId("bursa-claim-btn").click();
    await page.getByTestId("bursa-claim-confirm-btn").click();
    await page.getByRole("button", { name: "Kembali ke Bursa" }).click();
    await expect(page.getByText("Bursa Kasus Tersedia")).toBeVisible();
  });

  test(...tc("BUR-008", "Kasus sudah diklaim konsultan lain (409) menampilkan alert", {
    feature: F_BURSA, type: "Negative",
    input: "POST /cases/701/claim → 409 'Kasus sudah diklaim'",
    expected: "Alert 'Kasus sudah diklaim', modal tertutup, tetap di daftar",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/cases/701/claim", { status: 409, json: { detail: "Kasus sudah diklaim" } });
    await page.goto("/bursa");
    await page.locator('[data-case-id="701"]').getByTestId("bursa-claim-btn").click();
    await page.getByTestId("bursa-claim-confirm-btn").click();
    await dialogs.waitFor("Kasus sudah diklaim");
    await expect(page.getByTestId("bursa-claim-modal")).toHaveCount(0);
    await expect(card(page)).toHaveCount(3);
  });

  test(...tc("BUR-009", "Gagal memuat bursa (403) menampilkan pesan error", {
    feature: F_BURSA, type: "Negative",
    input: "GET /cases/ → 403",
    expected: "Teks 'Gagal memuat data bursa. Pastikan Anda login sebagai konsultan.'",
  }), async ({ page, api }) => {
    api.on("GET", "/cases/", { status: 403, json: { detail: "Hanya konsultan" } });
    await page.goto("/bursa");
    await expect(page.getByText(/Gagal memuat data bursa/)).toBeVisible();
  });

  test(...tc("BUR-010", "Bursa kosong menampilkan empty state", {
    feature: F_BURSA, type: "Negative",
    input: "GET /cases/ → []",
    expected: "'Bursa Kosong' & badge '0 Kasus'",
  }), async ({ page, api }) => {
    api.on("GET", "/cases/", { json: { data: [] } });
    await page.goto("/bursa");
    await expect(page.getByText("Bursa Kosong")).toBeVisible();
    await expect(page.getByText("0 Kasus")).toBeVisible();
  });
});
