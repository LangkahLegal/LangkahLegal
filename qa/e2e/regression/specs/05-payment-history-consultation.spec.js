/**
 * F16 Pembayaran (Midtrans Snap), F17 Riwayat Client, F18 Detail Konsultasi (Zoom & Rating).
 */
import { test, expect, tc, knownDefect } from "../support/fixtures.js";
import { multipartField } from "../support/mock-api.js";
import { clientConsultation, consultationDetail } from "../support/mock-data.js";

const F_PAY = "F16 Pembayaran (Midtrans)";
const F_HIST = "F17 Riwayat Konsultasi Client";
const F_DETAIL = "F18 Detail Konsultasi (Zoom & Ulasan)";

// ═══════════════════════════════════════════════════════════════ PAYMENT
test.describe("Pembayaran @payment", () => {
  test.beforeEach(async ({ api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail({ status_pengajuan: "menunggu_pembayaran" }) } });
    api.on("GET", "/payments/status/501", { json: { data: null, message: "Belum ada transaksi pembayaran" } });
    api.on("POST", "/payments/create-transaction", { json: { snap_token: "snap-token-1", redirect_url: "", order_id: "LL-501" } });
    api.on("POST", "/payments/sync/501", { json: { synced: true, status_pembayaran: "settlement" } });
  });

  const payBtn = (page) => page.getByTestId("payment-pay-btn");
  const snapReady = (page) => page.waitForFunction(() => !!window.snap);

  test(...tc("PAY-001", "Halaman pembayaran menampilkan konsultan, jadwal & rincian biaya", {
    feature: F_PAY, type: "E2E",
    input: "Buka /payment/501 (status menunggu_pembayaran, tarif 150.000)",
    expected: "Nama konsultan, 'Rincian Biaya', 'Harga Per Sesi (30 Menit)', total Rp 150.000, tombol 'Bayar Sekarang'",
    tags: ["@smoke", "@mobile"],
  }), async ({ page }) => {
    await page.goto("/payment/501");
    await expect(page.getByTestId("payment-page")).toBeVisible();
    await expect(page.getByText("Siti Rahma, S.H., M.H.")).toBeVisible();
    await expect(page.getByText("Rincian Biaya")).toBeVisible();
    await expect(page.getByText("Harga Per Sesi (30 Menit)")).toBeVisible();
    await expect(page.getByText(/Rp\s?150\.000/).last()).toBeVisible();
    await expect(payBtn(page)).toContainText("Bayar Sekarang");
  });

  test(...tc("PAY-002", "Pembayaran sukses via Snap → sinkronisasi status → layar sukses", {
    feature: F_PAY, type: "E2E",
    input: "Klik 'Bayar Sekarang', Snap memanggil onSuccess",
    expected: "POST /payments/create-transaction {id_pengajuan:501}, snap.pay('snap-token-1'), POST /payments/sync/501, layar 'Pembayaran Berhasil!' → tombol kembali ke dashboard",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    await page.goto("/payment/501");
    await snapReady(page);
    await payBtn(page).click();
    await expect(page.getByText("Pembayaran Berhasil!")).toBeVisible();
    expect(api.calls("POST", "/payments/create-transaction")[0].body).toEqual({ id_pengajuan: 501 });
    expect(await page.evaluate(() => window.__snapCalls)).toEqual(["snap-token-1"]);
    expect(api.calls("POST", "/payments/sync/501")).toHaveLength(1);
    await page.getByRole("button", { name: "Kembali ke Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard\/client$/);
  });

  test(...tc("PAY-003", "Pembayaran pending (mis. VA belum dibayar) kembali ke dashboard", {
    feature: F_PAY, type: "E2E",
    input: "Snap memanggil onPending",
    expected: "Alert 'Pembayaran tertunda…' lalu redirect /dashboard/client",
  }), async ({ page, dialogs }) => {
    await page.goto("/payment/501");
    await snapReady(page);
    await page.evaluate(() => { window.__snapMode = "pending"; });
    await payBtn(page).click();
    await dialogs.waitFor("Pembayaran tertunda");
    await expect(page).toHaveURL(/\/dashboard\/client$/);
  });

  test(...tc("PAY-004", "Pembayaran ditolak/gagal di Snap menampilkan alert", {
    feature: F_PAY, type: "Negative",
    input: "Snap memanggil onError",
    expected: "Alert 'Pembayaran gagal. Silakan coba lagi.', tetap di halaman pembayaran",
  }), async ({ page, dialogs }) => {
    await page.goto("/payment/501");
    await snapReady(page);
    await page.evaluate(() => { window.__snapMode = "error"; });
    await payBtn(page).click();
    await dialogs.waitFor("Pembayaran gagal. Silakan coba lagi.");
    await expect(payBtn(page)).toBeVisible();
  });

  test(...tc("PAY-005", "Backend menolak pembuatan transaksi (status tidak valid)", {
    feature: F_PAY, type: "Negative",
    input: "POST create-transaction → 400 'Pengajuan tidak dalam status yang memerlukan pembayaran'",
    expected: "Alert berisi pesan backend; Snap tidak dibuka",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/payments/create-transaction", { status: 400, json: { detail: "Pengajuan tidak dalam status yang memerlukan pembayaran" } });
    await page.goto("/payment/501");
    await snapReady(page);
    await payBtn(page).click();
    await dialogs.waitFor("Pengajuan tidak dalam status yang memerlukan pembayaran");
    expect(await page.evaluate(() => window.__snapCalls)).toBeUndefined();
  });

  test(...tc("PAY-006", "Transaksi yang sudah lunas langsung menampilkan layar sukses", {
    feature: F_PAY, type: "Regression",
    input: "GET /payments/status/501 → {data:{status_pembayaran:'settlement'}} (format asli backend)",
    expected: "Layar 'Pembayaran Berhasil!' tampil; tombol 'Bayar Sekarang' tidak ditampilkan",
  }), async ({ page, api }) => {
    api.on("GET", "/payments/status/501", { json: { data: { status_pembayaran: "settlement", order_id: "LL-501" } } });
    await page.goto("/payment/501");
    await expect(page.getByText("Pembayaran Berhasil!")).toBeVisible({ timeout: 5000 });
  });

  test(...tc("PAY-012", "Pembayaran tertunda terdeteksi lunas lewat polling tanpa muat ulang", {
    feature: F_PAY, type: "Regression",
    input: "GET /payments/status/501 → pending, lalu settlement pada polling berikutnya (5 detik)",
    expected: "Tombol 'Bayar Sekarang' tampil dulu, lalu layar 'Pembayaran Berhasil!' muncul sendiri",
  }), async ({ page, api }) => {
    let calls = 0;
    api.on("GET", "/payments/status/501", () => ({
      json: { data: { status_pembayaran: calls++ === 0 ? "pending" : "settlement", order_id: "LL-501" } },
    }));
    await page.goto("/payment/501");
    await expect(payBtn(page)).toBeVisible();
    await expect(page.getByText("Pembayaran Berhasil!")).toBeVisible({ timeout: 15_000 });
    expect(calls).toBeGreaterThan(1);
  });

  test(...tc("PAY-007", "Script Midtrans gagal dimuat: user mendapat umpan balik saat klik bayar", {
    feature: F_PAY, type: "Negative",
    input: "Request snap.js diblokir (CDN down/adblock), klik 'Bayar Sekarang'",
    expected: "Pesan error ditampilkan (mis. 'Layanan pembayaran tidak tersedia'), bukan diam tanpa respon",
  }), async ({ page, dialogs }) => {
    knownDefect("BUG-13");
    await page.route("**/snap/snap.js", (r) => r.abort());
    await page.goto("/payment/501");
    await payBtn(page).click();
    await expect.poll(() => dialogs.messages.length, { timeout: 4000 }).toBeGreaterThan(0);
  });

  test(...tc("PAY-008", "Detail pengajuan gagal dimuat menampilkan state error + Coba Lagi", {
    feature: F_PAY, type: "Negative",
    input: "GET /consultations/501 → 404",
    expected: "Teks 'Gagal Memuat Pembayaran' dan tombol 'Coba Lagi'",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/501", { status: 404, json: { detail: "Data pengajuan tidak ditemukan" } });
    await page.goto("/payment/501");
    await expect(page.getByText("Gagal Memuat Pembayaran")).toBeVisible();
    await expect(page.getByRole("button", { name: "Coba Lagi" })).toBeVisible();
  });

  test(...tc("PAY-009", "Klik 'Bayar' berulang hanya membuat satu transaksi", {
    feature: F_PAY, type: "Edge Case",
    input: "Klik 2x cepat, create-transaction delay 1.5s",
    expected: "Hanya 1 POST /payments/create-transaction",
  }), async ({ page, api }) => {
    api.on("POST", "/payments/create-transaction", { delay: 1500, json: { snap_token: "snap-token-1" } });
    await page.goto("/payment/501");
    await snapReady(page);
    await payBtn(page).click();
    await payBtn(page).click({ force: true, timeout: 1000 }).catch(() => {});
    await expect(page.getByText("Pembayaran Berhasil!")).toBeVisible();
    expect(api.calls("POST", "/payments/create-transaction")).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════ HISTORY CLIENT
test.describe("Riwayat Client @history", () => {
  test(...tc("HIS-001", "Riwayat diurutkan (terjadwal → pending → menunggu bayar → lainnya) & hitung selesai", {
    feature: F_HIST, type: "Regression",
    input: "5 pengajuan: selesai(A), terjadwal(B), pending(C), dibatalkan(D), selesai(E)",
    expected: "Badge '2 Selesai'; urutan kartu pertama B lalu C; total 5 kartu",
    tags: ["@mobile"],
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    const mk = (id, status, name) => clientConsultation({ id_pengajuan: id, status_pengajuan: status, jadwal_ketersediaan: { tanggal: "2025-01-01", konsultan: { nama_lengkap: name } } });
    api.on("GET", "/consultations/", { json: { data: [mk(1, "selesai", "Konsultan A"), mk(2, "terjadwal", "Konsultan B"), mk(3, "pending", "Konsultan C"), mk(4, "dibatalkan", "Konsultan D"), mk(5, "selesai", "Konsultan E")] } });
    await page.goto("/history/client");
    await expect(page.getByText("2 Selesai")).toBeVisible();
    const names = page.locator("h3").filter({ hasText: /^Konsultan [A-E]$/ });
    await expect(names).toHaveCount(5);
    await expect(names.nth(0)).toHaveText("Konsultan B");
    await expect(names.nth(1)).toHaveText("Konsultan C");
  });

  test(...tc("HIS-002", "Riwayat kosong menampilkan empty state", {
    feature: F_HIST, type: "Negative",
    input: "GET /consultations/ → []",
    expected: "'Riwayat Kosong' dan badge '0 Selesai'",
  }), async ({ page, loginAs }) => {
    await loginAs("client");
    await page.goto("/history/client");
    await expect(page.getByText("Riwayat Kosong")).toBeVisible();
    await expect(page.getByText("0 Selesai")).toBeVisible();
  });

  test(...tc("HIS-003", "Klik 'Lihat Detail' pada riwayat membuka detail konsultasi", {
    feature: F_HIST, type: "E2E",
    input: "1 pengajuan selesai id=501, klik 'Lihat Detail'",
    expected: "Redirect ke /consultation/501",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/", { json: { data: [clientConsultation({ status_pengajuan: "selesai" })] } });
    api.on("GET", "/consultations/501", { json: { data: consultationDetail({ status_pengajuan: "selesai" }) } });
    await page.goto("/history/client");
    await page.getByRole("button", { name: /Lihat Detail/ }).click();
    await expect(page).toHaveURL(/\/consultation\/501$/);
  });
});

// ═══════════════════════════════════════════════════════════════ CONSULTATION DETAIL
test.describe("Detail Konsultasi @consultation", () => {
  test(...tc("CON-001", "Client melihat detail konsultasi terjadwal lengkap dengan dokumen & link Zoom", {
    feature: F_DETAIL, type: "E2E",
    input: "Sesi client, GET /consultations/501 status=terjadwal, link_zoom terisi",
    expected: "Badge 'terjadwal', deskripsi kasus, dokumen 'sertifikat-tanah.pdf', link Zoom, tombol 'Gabung Sesi Konsultasi' membuka tab baru",
    tags: ["@smoke"],
  }), async ({ page, api, loginAs, context }) => {
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail({ link_zoom: "https://zoom.us/j/111222333" }) } });
    await page.goto("/consultation/501");
    await expect(page.getByText("terjadwal", { exact: true })).toBeVisible();
    await expect(page.getByText("Sengketa tanah warisan keluarga di Bekasi.")).toBeVisible();
    await expect(page.getByText("sertifikat-tanah.pdf")).toBeVisible();
    await expect(page.getByText("https://zoom.us/j/111222333")).toBeVisible();
    const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "Gabung Sesi Konsultasi" }).click()]);
    expect(popup.url()).toContain("zoom.us/j/111222333");
  });

  test(...tc("CON-002", "Salin link Zoom ke clipboard", {
    feature: F_DETAIL, type: "E2E",
    input: "Klik ikon salin di samping link Zoom",
    expected: "Clipboard berisi link Zoom, ikon berubah menjadi tanda centang",
  }), async ({ page, api, loginAs, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail({ link_zoom: "https://zoom.us/j/111222333" }) } });
    await page.goto("/consultation/501");
    await page.getByRole("button", { name: "content_copy" }).click();
    await expect(page.getByRole("button", { name: "check" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://zoom.us/j/111222333");
  });

  test(...tc("CON-003", "Client memberi rating & ulasan untuk menyelesaikan sesi", {
    feature: F_DETAIL, type: "E2E",
    input: "Klik 'Beri Ulasan & Selesaikan' → pilih bintang 4 → ulasan 'Sangat membantu' → Kirim",
    expected: "Tombol Kirim nonaktif sebelum memilih bintang; POST /consultations/501/rating {skor_rating:4, ulasan_teks:'Sangat membantu'}; modal tertutup",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail() } });
    api.on("POST", "/consultations/501/rating", { json: { message: "ok" } });
    await page.goto("/consultation/501");
    await page.getByRole("button", { name: "Beri Ulasan & Selesaikan" }).click();
    await expect(page.getByText("Sesi Selesai")).toBeVisible();
    const send = page.getByRole("button", { name: "Kirim Ulasan" });
    await expect(send).toBeDisabled();
    await page.getByRole("button", { name: /^star/ }).nth(3).click();
    await page.getByPlaceholder("Bagikan pengalaman konsultasi Anda di sini...").fill("Sangat membantu");
    await expect(page.getByText("15/500")).toBeVisible();
    await send.click();
    await expect(page.getByText("Sesi Selesai")).toHaveCount(0);
    expect(api.calls("POST", "/consultations/501/rating")[0].body).toEqual({ skor_rating: 4, ulasan_teks: "Sangat membantu" });
  });

  test(...tc("CON-004", "Ulasan dibatasi maksimal 500 karakter", {
    feature: F_DETAIL, type: "Edge Case",
    input: "Ketik 600 karakter pada textarea ulasan",
    expected: "Nilai terpotong menjadi 500 karakter dan penghitung '500/500'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail() } });
    await page.goto("/consultation/501");
    await page.getByRole("button", { name: "Beri Ulasan & Selesaikan" }).click();
    const ta = page.getByPlaceholder("Bagikan pengalaman konsultasi Anda di sini...");
    await ta.fill("x".repeat(600));
    await expect(page.getByText("500/500")).toBeVisible();
    expect((await ta.inputValue()).length).toBe(500);
  });

  test(...tc("CON-005", "Gagal mengirim ulasan menampilkan pesan error dari backend", {
    feature: F_DETAIL, type: "Negative",
    input: "POST rating → 400 'Ulasan sudah pernah diberikan'",
    expected: "Alert 'Gagal menyimpan ulasan: Ulasan sudah pernah diberikan', modal tetap terbuka",
  }), async ({ page, api, loginAs, dialogs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail() } });
    api.on("POST", "/consultations/501/rating", { status: 400, json: { detail: "Ulasan sudah pernah diberikan" } });
    await page.goto("/consultation/501");
    await page.getByRole("button", { name: "Beri Ulasan & Selesaikan" }).click();
    await page.getByRole("button", { name: /^star/ }).nth(4).click();
    await page.getByRole("button", { name: "Kirim Ulasan" }).click();
    await dialogs.waitFor("Gagal menyimpan ulasan: Ulasan sudah pernah diberikan");
    await expect(page.getByText("Sesi Selesai")).toBeVisible();
  });

  test(...tc("CON-006", "Konsultasi dibatalkan tidak menampilkan bagian Zoom maupun tombol ulasan", {
    feature: F_DETAIL, type: "Regression",
    input: "status_pengajuan=dibatalkan",
    expected: "Teks 'Link Zoom Meetings' & 'Beri Ulasan & Selesaikan' tidak ada; badge 'dibatalkan'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail({ status_pengajuan: "dibatalkan" }) } });
    await page.goto("/consultation/501");
    await expect(page.getByText("dibatalkan", { exact: true })).toBeVisible();
    await expect(page.getByText("Link Zoom Meetings")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Beri Ulasan & Selesaikan" })).toHaveCount(0);
  });

  test(...tc("CON-007", "Detail tidak ditemukan / bukan milik user menampilkan state error", {
    feature: F_DETAIL, type: "Negative",
    input: "GET /consultations/999 → 403 'Anda tidak berhak'",
    expected: "Teks 'Gagal memuat detail konsultasi.' dan tombol 'Coba Lagi'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/consultations/999", { status: 403, json: { detail: "Anda tidak berhak" } });
    await page.goto("/consultation/999");
    await expect(page.getByText("Gagal memuat detail konsultasi.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Coba Lagi" })).toBeVisible();
  });

  test(...tc("CON-008", "Konsultan menambahkan link Zoom untuk sesi terjadwal", {
    feature: F_DETAIL, type: "E2E",
    input: "Sesi konsultan, link kosong → ikon tambah link → 'https://zoom.us/j/999' → Simpan",
    expected: "PUT /consultations/501/zoom-link (form-data link_zoom), mode edit tertutup; label tombol 'Mulai Sesi Konsultasi'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("konsultan");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail() } });
    api.on("PUT", "/consultations/501/zoom-link", { json: { message: "ok" } });
    await page.goto("/consultation/501");
    await expect(page.getByRole("button", { name: "Mulai Sesi Konsultasi" })).toBeDisabled();
    await page.getByRole("button", { name: "add_link" }).click();
    await page.getByPlaceholder("https://zoom.us/j/123456789").fill("https://zoom.us/j/999");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByPlaceholder("https://zoom.us/j/123456789")).toHaveCount(0);
    expect(multipartField(api.calls("PUT", "/consultations/501/zoom-link")[0].body, "link_zoom")).toBe("https://zoom.us/j/999");
  });

  test(...tc("CON-009", "Link Zoom tidak valid ditolak sebelum disimpan", {
    feature: F_DETAIL, type: "Negative",
    input: "Isi link Zoom 'bukan-url' lalu Simpan",
    expected: "Muncul validasi format URL; tidak ada request PUT zoom-link",
  }), async ({ page, api, loginAs }) => {
    knownDefect("BUG-27");
    await loginAs("konsultan");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail() } });
    api.on("PUT", "/consultations/501/zoom-link", { json: { message: "ok" } });
    await page.goto("/consultation/501");
    await page.getByRole("button", { name: "add_link" }).click();
    await page.getByPlaceholder("https://zoom.us/j/123456789").fill("bukan-url");
    await page.getByRole("button", { name: "Simpan" }).click();
    await page.waitForTimeout(600);
    expect(api.calls("PUT", "/consultations/501/zoom-link")).toHaveLength(0);
  });

  test(...tc("CON-010", "Konsultan tidak melihat tombol ulasan & dapat membatalkan edit link", {
    feature: F_DETAIL, type: "Regression",
    input: "Sesi konsultan, status terjadwal → ikon tambah link → Batal",
    expected: "Tombol 'Beri Ulasan & Selesaikan' tidak ada; setelah Batal kembali ke tampilan 'Link belum tersedia'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("konsultan");
    api.on("GET", "/consultations/501", { json: { data: consultationDetail() } });
    await page.goto("/consultation/501");
    await expect(page.getByRole("button", { name: "Beri Ulasan & Selesaikan" })).toHaveCount(0);
    await page.getByRole("button", { name: "add_link" }).click();
    await page.getByRole("button", { name: "Batal" }).click();
    await expect(page.getByText("Link belum tersedia")).toBeVisible();
  });
});
