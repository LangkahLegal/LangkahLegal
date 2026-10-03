/**
 * F32 Dashboard Admin, F33 Verifikasi Konsultan, F34 Knowledge Base (dokumen hukum RAG).
 */
import { test, expect, tc, knownDefect, expectNoCrash } from "../support/fixtures.js";
import { multipartField, multipartFilenames } from "../support/mock-api.js";
import { adminConsultant, adminDocument, documentChunk } from "../support/mock-data.js";

const F_ADM = "F32 Dashboard Admin";
const F_VER = "F33 Verifikasi Konsultan (Admin)";
const F_KNW = "F34 Knowledge Base Dokumen Hukum (Admin)";

test.beforeEach(async ({ loginAs }) => loginAs("admin"));

// ═══════════════════════════════════════════════════════════════ DASHBOARD
test.describe("Dashboard Admin @admin", () => {
  test(...tc("ADM-001", "Dashboard admin menampilkan statistik platform & keuangan", {
    feature: F_ADM, type: "E2E",
    input: "GET /admin/stats {users:120, clients:90, konsultan:29, pending:2, tx:35, revenue:5jt, komisi:500rb}",
    expected: "Kartu 120/90/29/2, 'Monitoring Transaksi' 35, 'Rp 5.000.000', 'Rp 500.000'",
    tags: ["@smoke", "@mobile"],
  }), async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    for (const v of ["120", "90", "29"]) await expect(page.getByText(v, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Rp 5.000.000")).toBeVisible();
    await expect(page.getByText("Rp 500.000")).toBeVisible();
    await expect(page.getByText("35", { exact: true })).toBeVisible();
  });

  test(...tc("ADM-002", "Pengajuan verifikasi terbaru tampil & membuka detail", {
    feature: F_ADM, type: "E2E",
    input: "Ada konsultan pending 'Fajar Nugroho' (id 20) → 'Lihat Detail'",
    expected: "Kartu Fajar Nugroho (Pidana • Bandung • 4 tahun, Rp 200.000); klik → /verification/20",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/consultants/20", { json: { data: adminConsultant() } });
    await page.goto("/dashboard/admin");
    await expect(page.getByText("Fajar Nugroho")).toBeVisible();
    await expect(page.getByText(/Pidana • Bandung • 4 tahun/)).toBeVisible();
    await page.getByRole("button", { name: /Lihat Detail|chevron_right/ }).first().click();
    await expect(page).toHaveURL(/\/verification\/20$/);
  });

  test(...tc("ADM-003", "Tidak ada pengajuan pending menampilkan empty state; stats gagal tidak crash", {
    feature: F_ADM, type: "Negative",
    input: "GET /admin/consultants → semua terverifikasi; GET /admin/stats → 500",
    expected: "Empty state 'Selesai!', kartu statistik bernilai 0, tanpa crash",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/consultants", { json: { data: [adminConsultant({ status_verifikasi: "terverifikasi" })] } });
    api.on("GET", "/admin/stats", { status: 500, json: {} });
    await page.goto("/dashboard/admin");
    await expect(page.getByText("Selesai!")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Rp 0").first()).toBeVisible();
    await expectNoCrash(page);
  });
});

// ═══════════════════════════════════════════════════════════════ VERIFICATION
test.describe("Verifikasi Konsultan @admin", () => {
  const cardNames = (page) => page.locator("h3").filter({ hasText: /Fajar|Gita|Hendra|Indah/ });

  test(...tc("VER-001", "Daftar ajuan verifikasi dengan tab status berhitung", {
    feature: F_VER, type: "E2E",
    input: "4 konsultan (2 pending, 1 terverifikasi, 1 ditolak)",
    expected: "Tab 'Semua (4)', 'Pending (2)', 'Terverifikasi (1)', 'Ditolak (1)', 4 kartu",
    tags: ["@smoke"],
  }), async ({ page }) => {
    await page.goto("/verification");
    for (const t of ["Semua (4)", "Pending (2)", "Terverifikasi (1)", "Ditolak (1)"]) await expect(page.getByRole("button", { name: t })).toBeVisible();
    await expect(cardNames(page)).toHaveCount(4);
  });

  test(...tc("VER-002", "Filter tab 'Pending' memanggil API dengan status_filter", {
    feature: F_VER, type: "Regression",
    input: "Klik tab 'Pending (2)'",
    expected: "GET /admin/consultants?status_filter=pending, 2 kartu (Fajar & Gita)",
  }), async ({ page, api }) => {
    await page.goto("/verification");
    await page.getByRole("button", { name: "Pending (2)" }).click();
    await expect(cardNames(page)).toHaveCount(2);
    expect(api.calls("GET", "/admin/consultants").some((r) => r.query.status_filter === "pending")).toBe(true);
  });

  test(...tc("VER-003", "Pencarian berdasarkan nama & spesialisasi, serta tanpa hasil", {
    feature: F_VER, type: "E2E",
    input: "'gita' → 'umum' → 'xyz'",
    expected: "'gita': Gita Permata; 'umum': Hendra Saputra; 'xyz': 'Tidak Ditemukan'",
  }), async ({ page }) => {
    await page.goto("/verification");
    const s = page.getByTestId("explore-search-input");
    await s.fill("gita");
    await expect(cardNames(page)).toHaveText(["Gita Permata"]);
    await s.fill("umum");
    await expect(cardNames(page)).toHaveText(["Hendra Saputra"]);
    await s.fill("xyz");
    await expect(page.getByText("Tidak Ditemukan")).toBeVisible();
  });

  test(...tc("VER-004", "Admin menyetujui konsultan dari halaman detail", {
    feature: F_VER, type: "E2E",
    input: "/verification/20 → 'Terima' → 'Ya, Verifikasi'",
    expected: "Data detail (email, izin, harga) tampil; PATCH /admin/consultants/20/verify {action:'terverifikasi', alasan:''}; redirect /verification",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("GET", "/admin/consultants/20", { json: { data: adminConsultant() } });
    api.on("PATCH", "/admin/consultants/20/verify", { json: { message: "ok" } });
    await page.goto("/verification/20");
    await expect(page.getByText("Fajar Nugroho").first()).toBeVisible();
    await expect(page.getByText("Rp 200.000")).toBeVisible();
    await page.getByRole("button", { name: /Terima/ }).click();
    await expect(page.getByText("Verifikasi Konsultan?")).toBeVisible();
    await page.getByRole("button", { name: "Ya, Verifikasi" }).click();
    await expect(page).toHaveURL(/\/verification$/);
    expect(api.calls("PATCH", "/admin/consultants/20/verify")[0].body).toEqual({ action: "terverifikasi", alasan: "" });
  });

  test(...tc("VER-005", "Penolakan wajib menyertakan alasan", {
    feature: F_VER, type: "Negative",
    input: "'Tolak' → alasan kosong → isi 'Nomor izin tidak terdaftar' → 'Ya, Tolak'",
    expected: "Tombol 'Ya, Tolak' nonaktif saat alasan kosong; PATCH {action:'ditolak', alasan:'Nomor izin tidak terdaftar'}",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/consultants/20", { json: { data: adminConsultant() } });
    api.on("PATCH", "/admin/consultants/20/verify", { json: { message: "ok" } });
    await page.goto("/verification/20");
    await page.getByRole("button", { name: /Tolak/ }).first().click();
    const confirm = page.getByRole("button", { name: "Ya, Tolak" });
    await expect(confirm).toBeDisabled();
    await page.getByPlaceholder("Masukkan alasan penolakan agar konsultan mengetahuinya...").fill("   ");
    await expect(confirm).toBeDisabled();
    await page.getByPlaceholder("Masukkan alasan penolakan agar konsultan mengetahuinya...").fill("Nomor izin tidak terdaftar");
    await confirm.click();
    await expect(page).toHaveURL(/\/verification$/);
    expect(api.calls("PATCH", "/admin/consultants/20/verify")[0].body).toEqual({ action: "ditolak", alasan: "Nomor izin tidak terdaftar" });
  });

  test(...tc("VER-006", "Konsultan yang sudah diverifikasi tidak menampilkan tombol aksi", {
    feature: F_VER, type: "Regression",
    input: "Detail konsultan status=terverifikasi",
    expected: "Tombol 'Terima' & 'Tolak' tidak ada",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/consultants/22", { json: { data: adminConsultant({ id_konsultan: 22, status_verifikasi: "terverifikasi" }) } });
    await page.goto("/verification/22");
    await expect(page.getByText("Fajar Nugroho").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Terima/ })).toHaveCount(0);
  });

  test(...tc("VER-007", "Detail konsultan tidak ditemukan", {
    feature: F_VER, type: "Negative",
    input: "GET /admin/consultants/999 → 404",
    expected: "Teks 'Data Konsultan Tidak Ditemukan'",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/consultants/999", { status: 404, json: { detail: "Konsultan tidak ditemukan" } });
    await page.goto("/verification/999");
    await expect(page.getByText("Data Konsultan Tidak Ditemukan")).toBeVisible({ timeout: 15_000 });
  });

  test(...tc("VER-008", "Kegagalan verifikasi di server diberitahukan ke admin", {
    feature: F_VER, type: "Negative",
    input: "PATCH /admin/consultants/20/verify → 500",
    expected: "Pesan error tampil (alert/toast) dan admin tetap di halaman detail",
  }), async ({ page, api, dialogs }) => {
    knownDefect("BUG-16");
    api.on("GET", "/admin/consultants/20", { json: { data: adminConsultant() } });
    api.on("PATCH", "/admin/consultants/20/verify", { status: 500, json: { detail: "Gagal update" } });
    await page.goto("/verification/20");
    await page.getByRole("button", { name: /Terima/ }).click();
    await page.getByRole("button", { name: "Ya, Verifikasi" }).click();
    await expect.poll(async () => dialogs.messages.length + (await page.getByText(/gagal/i).count()), { timeout: 4000 }).toBeGreaterThan(0);
  });

  test(...tc("VER-009", "Konsultan tanpa nama lengkap tidak membuat daftar verifikasi crash", {
    feature: F_VER, type: "Edge Case",
    input: "GET /admin/consultants berisi item nama_lengkap=null (profil baru)",
    expected: "Daftar tetap tampil, tidak ada 'Application error'",
  }), async ({ page, api, pageErrors }) => {
    knownDefect("BUG-11");
    api.on("GET", "/admin/consultants", { json: { data: [adminConsultant(), adminConsultant({ id_konsultan: 30, nama_lengkap: null })] } });
    await page.goto("/verification");
    await expect(page.getByText("Fajar Nugroho")).toBeVisible({ timeout: 5000 });
    expect(pageErrors).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════ KNOWLEDGE BASE
test.describe("Knowledge Base @admin", () => {
  const rows = (page) => page.locator("tbody tr");

  test(...tc("KNW-001", "Tabel dokumen hukum tampil dengan nomor/tahun, jumlah pasal & status", {
    feature: F_KNW, type: "E2E",
    input: "GET /admin/documents/ → 2 dokumen (total 2)",
    expected: "2 baris; '27 / 2022', '76', 'Berlaku'; 'Total Dokumen' 2",
    tags: ["@smoke"],
  }), async ({ page }) => {
    await page.goto("/knowledge");
    await expect(rows(page)).toHaveCount(2);
    await expect(page.getByText("27 / 2022")).toBeVisible();
    await expect(page.getByRole("cell", { name: "76" })).toBeVisible();
    await expect(page.getByText("Berlaku").first()).toBeVisible();
  });

  test(...tc("KNW-002", "Pencarian dokumen di-debounce (1 request setelah berhenti mengetik)", {
    feature: F_KNW, type: "Regression",
    input: "Ketik 'pidana' karakter per karakter",
    expected: "Hanya 1 request dengan search='pidana' & page=1 (tidak ada request per karakter)",
  }), async ({ page, api }) => {
    await page.goto("/knowledge");
    await expect(rows(page)).toHaveCount(2);
    await page.getByPlaceholder("Cari nama undang-undang atau dokumen...").pressSequentially("pidana", { delay: 60 });
    await expect.poll(() => api.calls("GET", "/admin/documents/").filter((r) => r.query.search).length, { timeout: 4000 }).toBe(1);
    await page.waitForTimeout(700);
    const searchCalls = api.calls("GET", "/admin/documents/").filter((r) => r.query.search);
    expect(searchCalls).toHaveLength(1);
    expect(searchCalls[0].query).toMatchObject({ search: "pidana", page: "1" });
  });

  test(...tc("KNW-003", "Filter kategori & paginasi", {
    feature: F_KNW, type: "E2E",
    input: "Kategori 'Pidana'; total 45 dokumen → tombol halaman berikut; input halaman '9' (di luar rentang)",
    expected: "Request kategori=pidana; 'dari 3'; next → page=2; input 9 dikembalikan ke halaman aktif",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/documents/", (req) => ({ json: { data: [adminDocument({ frbr_uri: `/doc/${req.query.page}` })], total: 45 } }));
    await page.goto("/knowledge");
    await page.waitForTimeout(700); // tunggu debounce awal (lihat KNW-011 / BUG-36)
    await page.getByRole("button", { name: "Pidana", exact: true }).click();
    await expect.poll(() => api.calls("GET", "/admin/documents/").some((r) => r.query.kategori === "pidana")).toBe(true);
    await expect(page.getByText("dari 3")).toBeVisible();
    await page.getByTitle("Selanjutnya").click();
    await expect.poll(() => api.calls("GET", "/admin/documents/").some((r) => r.query.page === "2")).toBe(true);
    const pageInput = page.locator("input.w-10");
    await pageInput.fill("9");
    await pageInput.press("Enter");
    await expect(pageInput).toHaveValue("2");
  });

  test(...tc("KNW-011", "Pindah halaman segera setelah halaman dimuat tidak di-reset ke halaman 1", {
    feature: F_KNW, type: "Edge Case",
    input: "total 45 dokumen; klik 'Selanjutnya' < 500 ms setelah halaman dimuat, tunggu 1 detik",
    expected: "Input halaman tetap '2' dan request terakhir page=2",
  }), async ({ page, api }) => {
    knownDefect("BUG-36");
    api.on("GET", "/admin/documents/", (req) => ({ json: { data: [adminDocument({ frbr_uri: `/doc/${req.query.page}` })], total: 45 } }));
    await page.goto("/knowledge");
    await page.getByTitle("Selanjutnya").click();
    await page.waitForTimeout(1000);
    await expect(page.locator("input.w-10")).toHaveValue("2", { timeout: 1500 });
  });

  test(...tc("KNW-004", "Unggah dokumen PDF baru → proses background → toast selesai", {
    feature: F_KNW, type: "E2E",
    input: "Isi nama/nomor/tahun/kategori/status + 'uu-pdp.pdf' → 'Unggah'; job status processing → completed",
    expected: "Tombol Unggah nonaktif sebelum lengkap; POST /admin/documents/upload multipart lengkap; banner proses tampil; toast 'Proses dokumen selesai!'",
  }), async ({ page, api }) => {
    api.on("POST", "/admin/documents/upload", { json: { job_id: "job-1", status: "queued" } });
    let polls = 0;
    api.on("GET", "/admin/documents/jobs/job-1", () => ({ json: ++polls < 2 ? { status: "processing" } : { status: "completed", message: "Proses dokumen selesai!" } }));
    await page.goto("/knowledge");
    await page.getByRole("button", { name: /Tambah Dokumen/ }).click();
    const unggah = page.getByRole("button", { name: "Unggah", exact: true });
    await expect(unggah).toBeDisabled();
    await page.getByPlaceholder("Contoh: Undang-Undang Perlindungan Data Pribadi").fill("UU Perlindungan Data Pribadi");
    await page.getByPlaceholder("Contoh: 27").fill("27");
    await page.getByPlaceholder("Contoh: 2022").fill("2022");
    await page.getByText("Pilih Kategori").click();
    await page.locator(".max-h-60 > div").filter({ hasText: /^Teknologi Informasi$/ }).click();
    await page.getByText("Pilih Status Hukum").click();
    await page.locator(".max-h-60 > div").filter({ hasText: /^Berlaku$/ }).click();
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles({ name: "uu-pdp.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await expect(unggah).toBeEnabled();
    await unggah.click();
    await expect(page.getByText(/Sistem sedang memproses ekstraksi/)).toBeVisible();
    await expect(page.getByText("Proses dokumen selesai!")).toBeVisible({ timeout: 15_000 });
    const body = api.calls("POST", "/admin/documents/upload")[0].body;
    expect(multipartField(body, "nama_uu")).toBe("UU Perlindungan Data Pribadi");
    expect(multipartField(body, "nomor_uu")).toBe("27");
    expect(multipartField(body, "tahun_uu")).toBe("2022");
    expect(multipartField(body, "kategori")).toBe("teknologi_informasi");
    expect(multipartField(body, "status_hukum")).toBe("Berlaku");
    expect(multipartFilenames(body, "file")).toEqual(["uu-pdp.pdf"]);
  });

  test(...tc("KNW-005", "Job pemrosesan gagal menampilkan toast error", {
    feature: F_KNW, type: "Negative",
    input: "localStorage activeJobId='job-x' (job berjalan sebelumnya), status → failed 'PDF hasil scan'",
    expected: "Toast 'Gagal memproses dokumen: PDF hasil scan' & banner hilang",
  }), async ({ page, api }) => {
    await page.addInitScript(() => localStorage.setItem("activeJobId", "job-x"));
    api.on("GET", "/admin/documents/jobs/job-x", { json: { status: "failed", error: "PDF hasil scan" } });
    await page.goto("/knowledge");
    await expect(page.getByText("Gagal memproses dokumen: PDF hasil scan")).toBeVisible();
    await expect(page.getByText(/Sistem sedang memproses ekstraksi/)).toHaveCount(0);
  });

  test(...tc("KNW-006", "Menghapus dokumen beserta seluruh pasalnya", {
    feature: F_KNW, type: "E2E",
    input: "Ikon hapus pada baris 'UU Perlindungan Data Pribadi' → 'Ya, Hapus'",
    expected: "Modal konfirmasi menyebut nama dokumen; DELETE /admin/documents/by-uri?frbr_uri=/akn/id/act/uu/2022/27; toast 'Dokumen berhasil dihapus!'",
  }), async ({ page, api }) => {
    api.on("DELETE", "/admin/documents/by-uri", { json: { message: "ok" } });
    await page.goto("/knowledge");
    await rows(page).first().getByRole("button", { name: "delete" }).click();
    await expect(page.getByText("Hapus Dokumen?")).toBeVisible();
    await page.getByRole("button", { name: "Ya, Hapus" }).click();
    await expect(page.getByText("Dokumen berhasil dihapus!")).toBeVisible();
    expect(api.calls("DELETE", "/admin/documents/by-uri")[0].query).toEqual({ frbr_uri: "/akn/id/act/uu/2022/27" });
  });

  test(...tc("KNW-007", "Mengganti dokumen dengan PDF baru (metadata terisi otomatis)", {
    feature: F_KNW, type: "E2E",
    input: "Ikon sync pada baris pertama → pilih 'uu-pdp-revisi.pdf' → 'Ganti'",
    expected: "Form 'Ganti Dokumen' terisi metadata lama; PUT /admin/documents/replace multipart dengan frbr_uri & file baru",
  }), async ({ page, api }) => {
    api.on("PUT", "/admin/documents/replace", { json: { job_id: "job-2" } });
    api.on("GET", "/admin/documents/jobs/job-2", { json: { status: "completed", message: "Dokumen diganti" } });
    await page.goto("/knowledge");
    await rows(page).first().getByRole("button", { name: "sync" }).click();
    await expect(page.getByText("Ganti Dokumen")).toBeVisible();
    await expect(page.getByPlaceholder("Contoh: Undang-Undang Perlindungan Data Pribadi")).toHaveValue("Undang-Undang Perlindungan Data Pribadi");
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles({ name: "uu-pdp-revisi.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await page.getByRole("button", { name: "Ganti", exact: true }).click();
    await expect.poll(() => api.calls("PUT", "/admin/documents/replace").length).toBe(1);
    const body = api.calls("PUT", "/admin/documents/replace")[0].body;
    expect(multipartField(body, "frbr_uri")).toBe("/akn/id/act/uu/2022/27");
    expect(multipartFilenames(body, "file")).toEqual(["uu-pdp-revisi.pdf"]);
  });

  test(...tc("KNW-008", "Detail dokumen: daftar pasal, buka semua, edit isi pasal", {
    feature: F_KNW, type: "E2E",
    input: "/knowledge/detail?uri=/akn/id/act/uu/2022/27 → 'Buka Semua' → 'Edit Pasal' Pasal 1 → ubah teks → Simpan",
    expected: "Kartu dokumen & 'Daftar Pasal'; isi pasal terlihat; PATCH /admin/documents/chunks/9001 {isi_teks, kategori}; toast 'Berhasil menyimpan perubahan pasal!'",
  }), async ({ page, api }) => {
    api.on("GET", "/admin/documents/chunks", { json: { data: [documentChunk(), documentChunk({ id_dokumen: 9002, pasal_bagian: "Pasal 2", isi_teks: "Undang-Undang ini berlaku untuk setiap orang." })], total: 2 } });
    api.on("PATCH", "/admin/documents/chunks/9001", { json: { message: "ok" } });
    await page.goto(`/knowledge/detail?uri=${encodeURIComponent("/akn/id/act/uu/2022/27")}`);
    await expect(page.getByText("Daftar Pasal")).toBeVisible();
    await expect(page.getByText("Nomor 27 Tahun 2022")).toBeVisible();
    await page.getByRole("button", { name: /Buka Semua/ }).click();
    await expect(page.getByText("Undang-Undang ini berlaku untuk setiap orang.")).toBeVisible();
    await page.getByRole("button", { name: /Edit Pasal/ }).first().click();
    const ta = page.locator("textarea");
    await ta.fill("(1) Data Pribadi adalah data tentang orang perseorangan yang teridentifikasi.");
    await page.waitForTimeout(400); // accordion memakai transition 300ms; hindari klik saat tombol masih bergeser
    await page.getByRole("button", { name: "Simpan", exact: true }).click();
    await expect(page.getByText("Berhasil menyimpan perubahan pasal!")).toBeVisible();
    expect(api.calls("PATCH", "/admin/documents/chunks/9001")[0].body).toEqual({ isi_teks: "(1) Data Pribadi adalah data tentang orang perseorangan yang teridentifikasi.", kategori: "teknologi_informasi" });
  });

  test(...tc("KNW-009", "Detail dokumen tanpa parameter uri menampilkan 'Tidak Ada Data'", {
    feature: F_KNW, type: "Negative",
    input: "Buka /knowledge/detail tanpa query",
    expected: "Empty state 'Tidak Ada Data'",
  }), async ({ page }) => {
    await page.goto("/knowledge/detail");
    await expect(page.getByText("Tidak Ada Data")).toBeVisible();
  });

  test(...tc("KNW-010", "Tahun undang-undang di luar rentang ditolak saat unggah", {
    feature: F_KNW, type: "Negative",
    input: "Tahun '3000' (atribut max = tahun berjalan) dengan field lain valid",
    expected: "Tombol 'Unggah' nonaktif / pesan validasi; tidak ada POST upload",
  }), async ({ page, api }) => {
    knownDefect("BUG-35");
    api.on("POST", "/admin/documents/upload", { json: { job_id: "job-9" } });
    await page.goto("/knowledge");
    await page.getByRole("button", { name: /Tambah Dokumen/ }).click();
    await page.getByPlaceholder("Contoh: Undang-Undang Perlindungan Data Pribadi").fill("UU Fiktif");
    await page.getByPlaceholder("Contoh: 27").fill("1");
    await page.getByPlaceholder("Contoh: 2022").fill("3000");
    await page.getByText("Pilih Kategori").click();
    await page.locator(".max-h-60 > div").filter({ hasText: /^Umum$/ }).click();
    await page.getByText("Pilih Status Hukum").click();
    await page.locator(".max-h-60 > div").filter({ hasText: /^Berlaku$/ }).click();
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles({ name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await page.getByRole("button", { name: "Unggah", exact: true }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(600);
    expect(api.calls("POST", "/admin/documents/upload")).toHaveLength(0);
  });
});
