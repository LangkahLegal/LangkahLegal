/**
 * F20 Dashboard Konsultan, F21 Detail Permintaan (terima/tolak & jadwal klaim bursa),
 * F22 Daftar Klien, F23 Kelola Jadwal, F25 Riwayat Konsultan.
 */
import { test, expect, tc, knownDefect, expectNoCrash } from "../support/fixtures.js";
import { USERS, consultantRequest, consultationDetail, dateFromToday } from "../support/mock-data.js";

const F_DASH = "F20 Dashboard Konsultan";
const F_REQ = "F21 Detail Permintaan Konsultasi";
const F_CLIENTS = "F22 Daftar Klien Aktif";
const F_SCHED = "F23 Kelola Jadwal Ketersediaan";
const F_HIST = "F25 Riwayat Sesi Konsultan";

test.beforeEach(async ({ loginAs }) => loginAs("konsultan"));

// ═══════════════════════════════════════════════════════════════ DASHBOARD
test.describe("Dashboard Konsultan @consultant", () => {
  test(...tc("CDB-001", "Dashboard menampilkan pendapatan, statistik & empty state", {
    feature: F_DASH, type: "E2E",
    input: "stats {income:1.500.000, klien:4, aktif:2}, tanpa request",
    expected: "'Rp 1.500.000', 'Konsultasi Aktif' 2, 'Total Klien' 4, 'Jadwal Kosong', 'Kotak Masuk Bersih'",
    tags: ["@smoke", "@mobile"],
  }), async ({ page }) => {
    await page.goto("/dashboard/consultant");
    await expect(page.getByText("Rp 1.500.000")).toBeVisible();
    await expect(page.getByText("Konsultasi Aktif")).toBeVisible();
    await expect(page.getByText("Jadwal Kosong")).toBeVisible();
    await expect(page.getByText("Kotak Masuk Bersih")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Siti Rahma" })).toBeVisible();
  });

  test(...tc("CDB-002", "'Jadwal Terdekat' memilih sesi terjadwal paling dekat di masa depan", {
    feature: F_DASH, type: "Regression",
    input: "Active: terjadwal H+3 (Klien Jauh), terjadwal H+2 (Klien Dekat), terjadwal H-1 (Klien Lewat)",
    expected: "Hanya 'Klien Dekat' tampil di Jadwal Terdekat",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/me/requests/active", { json: [
      consultantRequest({ id_pengajuan: 1, status_pengajuan: "terjadwal", tanggal_pengajuan: dateFromToday(3), users: { nama: "Klien Jauh" } }),
      consultantRequest({ id_pengajuan: 2, status_pengajuan: "terjadwal", tanggal_pengajuan: dateFromToday(2), users: { nama: "Klien Dekat" } }),
      consultantRequest({ id_pengajuan: 3, status_pengajuan: "terjadwal", tanggal_pengajuan: dateFromToday(-1), users: { nama: "Klien Lewat" } }),
    ] });
    await page.goto("/dashboard/consultant");
    await expect(page.getByText("Klien Dekat")).toBeVisible();
    await expect(page.getByText("Klien Jauh")).toHaveCount(0);
    await expect(page.getByText("Klien Lewat")).toHaveCount(0);
  });

  test(...tc("CDB-003", "'Permintaan Baru' menyaring permintaan kedaluwarsa & membuka detail", {
    feature: F_DASH, type: "E2E",
    input: "Pending: H+2 (Rina Klien, id 601) & H-2 (Klien Basi); klik 'Lihat Detail' Rina",
    expected: "Hanya Rina tampil; klik membuka /request/601",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/me/requests/pending", { json: [
      consultantRequest(),
      consultantRequest({ id_pengajuan: 602, tanggal_pengajuan: dateFromToday(-2), users: { nama: "Klien Basi" } }),
    ] });
    api.on("GET", "/consultations/601", { json: { data: consultationDetail({ id_pengajuan: 601, status_pengajuan: "pending", nama_klien: "Rina Klien" }) } });
    await page.goto("/dashboard/consultant");
    await expect(page.getByText("Rina Klien")).toBeVisible();
    await expect(page.getByText("Klien Basi")).toHaveCount(0);
    await page.getByRole("button", { name: /Lihat Detail/ }).click();
    await expect(page).toHaveURL(/\/request\/601$/);
  });

  test(...tc("CDB-004", "Peringatan verifikasi ditolak beserta alasan & tautan ke profil", {
    feature: F_DASH, type: "E2E",
    input: "Profil status_verifikasi='ditolak', alasan_penolakan='Nomor izin tidak valid'",
    expected: "Kotak 'Pengajuan Verifikasi Ditolak' berisi alasan; klik 'Pengaturan Profil' → /setting/profile",
  }), async ({ page, api }) => {
    api.on("GET", "/users/me/profile/full", { json: { ...USERS.konsultan, status_verifikasi: "ditolak", alasan_penolakan: "Nomor izin tidak valid" } });
    await page.goto("/dashboard/consultant");
    await expect(page.getByText("Pengajuan Verifikasi Ditolak")).toBeVisible();
    await expect(page.getByText('"Nomor izin tidak valid"')).toBeVisible();
    await page.getByText("Pengaturan Profil").click();
    await expect(page).toHaveURL(/\/setting\/profile$/);
  });

  test(...tc("CDB-005", "Statistik gagal dimuat tidak membuat dashboard crash", {
    feature: F_DASH, type: "Negative",
    input: "GET /consultants/me/dashboard-stats → 500",
    expected: "Dashboard tetap tampil dengan nilai default 'Rp 0'",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/me/dashboard-stats", { status: 500, json: {} });
    await page.goto("/dashboard/consultant");
    await expect(page.getByText("Rp 0")).toBeVisible();
    await expectNoCrash(page);
  });
});

// ═══════════════════════════════════════════════════════════════ REQUEST DETAIL
test.describe("Detail Permintaan @consultant", () => {
  const detail = (o = {}) => consultationDetail({ id_pengajuan: 601, status_pengajuan: "pending", nama_klien: "Rina Klien", ...o });

  test(...tc("REQ-001", "Menerima permintaan reguler → status menunggu pembayaran", {
    feature: F_REQ, type: "E2E",
    input: "Buka /request/601 → klik 'Terima'",
    expected: "Info klien/jadwal/deskripsi/dokumen tampil; PUT /consultations/601/status?new_status=menunggu_pembayaran; layar 'Permintaan Berhasil Diterima!' → dashboard konsultan",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/601", { json: { data: detail() } });
    api.on("PUT", "/consultations/601/status", { json: { message: "ok" } });
    await page.goto("/request/601");
    await expect(page.getByText("Rina Klien")).toBeVisible();
    await expect(page.getByText("Sengketa tanah warisan keluarga di Bekasi.")).toBeVisible();
    await expect(page.getByText("sertifikat-tanah.pdf")).toBeVisible();
    await page.getByRole("button", { name: /Terima/ }).click();
    await expect(page.getByText("Permintaan Berhasil Diterima!")).toBeVisible();
    expect(api.calls("PUT", "/consultations/601/status")[0].query).toEqual({ new_status: "menunggu_pembayaran" });
    await page.getByRole("button", { name: "Kembali ke Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard\/consultant$/);
  });

  test(...tc("REQ-002", "Menolak permintaan", {
    feature: F_REQ, type: "E2E",
    input: "Klik 'Tolak'",
    expected: "PUT status?new_status=ditolak & layar 'Permintaan Berhasil Ditolak!'",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/601", { json: { data: detail() } });
    api.on("PUT", "/consultations/601/status", { json: { message: "ok" } });
    await page.goto("/request/601");
    await page.getByRole("button", { name: /Tolak/ }).click();
    await expect(page.getByText("Permintaan Berhasil Ditolak!")).toBeVisible();
    expect(api.calls("PUT", "/consultations/601/status")[0].query).toEqual({ new_status: "ditolak" });
  });

  test(...tc("REQ-003", "Klik ganda 'Terima' hanya mengirim satu request", {
    feature: F_REQ, type: "Edge Case",
    input: "Klik 'Terima' 2x cepat (response delay 1.5s)",
    expected: "Tombol dinonaktifkan saat proses; hanya 1 PUT /status terkirim",
  }), async ({ page, api }) => {
    knownDefect("BUG-09");
    api.on("GET", "/consultations/601", { json: { data: detail() } });
    api.on("PUT", "/consultations/601/status", { delay: 1500, json: { message: "ok" } });
    await page.goto("/request/601");
    const accept = page.getByRole("button", { name: /Terima/ });
    await accept.click();
    await accept.click({ timeout: 1000 }).catch(() => {});
    await expect(page.getByText("Permintaan Berhasil Diterima!")).toBeVisible();
    expect(api.calls("PUT", "/consultations/601/status")).toHaveLength(1);
  });

  test(...tc("REQ-004", "Gagal memproses permintaan menampilkan alert", {
    feature: F_REQ, type: "Negative",
    input: "PUT /status → 403 'Akses ditolak: Pengajuan ini bukan milik Anda'",
    expected: "Alert 'Gagal memproses permintaan.', tetap di halaman detail",
  }), async ({ page, api, dialogs }) => {
    api.on("GET", "/consultations/601", { json: { data: detail() } });
    api.on("PUT", "/consultations/601/status", { status: 403, json: { detail: "Akses ditolak: Pengajuan ini bukan milik Anda" } });
    await page.goto("/request/601");
    await page.getByRole("button", { name: /Terima/ }).click();
    await dialogs.waitFor("Gagal memproses permintaan.");
    await expect(page.getByText("Detail Permintaan")).toBeVisible();
  });

  test(...tc("REQ-005", "Klaim bursa: pilih slot & jam lalu 'Terima & Jadwalkan'", {
    feature: F_REQ, type: "E2E",
    input: `id_bursa=701, id_jadwal=null; slot ${dateFromToday(5)} 09:00–12:00; jam 10:00–11:00`,
    expected: "Badge 'Dari Bursa Kasus'; tombol terkunci sampai slot & jam dipilih; PUT /consultations/601/assign-schedule {id_jadwal:301, jam_mulai:'10:00:00', jam_selesai:'11:00:00'}; layar 'Permintaan Berhasil Diterima & Dijadwalkan!'",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/601", { json: { data: detail({ id_bursa: 701, id_jadwal: null }) } });
    api.on("GET", "/consultants/me/schedules", { json: [
      { id_jadwal: 301, tanggal: dateFromToday(5), jam_mulai: "09:00:00", jam_selesai: "12:00:00", status_tersedia: true, nama_klien: null },
      { id_jadwal: 302, tanggal: dateFromToday(6), jam_mulai: "09:00:00", jam_selesai: "12:00:00", status_tersedia: false, nama_klien: null },
    ] });
    api.on("PUT", "/consultations/601/assign-schedule", { json: { message: "ok" } });
    await page.goto("/request/601");
    await expect(page.getByText("Dari Bursa Kasus")).toBeVisible();
    const accept = page.getByRole("button", { name: /Terima & Jadwalkan/ });
    await expect(accept).toBeDisabled();
    await expect(page.getByText("09:00 - 12:00")).toHaveCount(1);
    await page.getByText("09:00 - 12:00").click();
    await page.locator("#jam-mulai-select").selectOption("10:00:00");
    await expect(page.locator("#jam-selesai-select option")).not.toContainText(["10:00"]);
    await page.locator("#jam-selesai-select").selectOption("11:00:00");
    await expect(page.getByText(/10:00 - 11:00/)).toBeVisible();
    await accept.click();
    await expect(page.getByText("Permintaan Berhasil Diterima & Dijadwalkan!")).toBeVisible();
    expect(api.calls("PUT", "/consultations/601/assign-schedule")[0].body).toEqual({ id_jadwal: 301, jam_mulai: "10:00:00", jam_selesai: "11:00:00" });
  });

  test(...tc("REQ-006", "Klaim bursa tanpa slot jadwal tersedia mengarahkan ke halaman Jadwal", {
    feature: F_REQ, type: "Negative",
    input: "Bursa claim, GET /consultants/me/schedules → []",
    expected: "Pesan 'Belum ada slot jadwal tersedia'; klik 'Jadwal' → /schedule",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/601", { json: { data: detail({ id_bursa: 701, id_jadwal: null }) } });
    await page.goto("/request/601");
    await expect(page.getByText(/Belum ada slot jadwal tersedia/)).toBeVisible();
    await page.locator("span.underline", { hasText: "Jadwal" }).click();
    await expect(page).toHaveURL(/\/schedule$/);
  });

  test(...tc("REQ-007", "Permintaan tidak ditemukan menampilkan 'Data tidak ditemukan.'", {
    feature: F_REQ, type: "Negative",
    input: "GET /consultations/999 → 404",
    expected: "Teks 'Data tidak ditemukan.'",
  }), async ({ page, api }) => {
    api.on("GET", "/consultations/999", { status: 404, json: { detail: "Data pengajuan tidak ditemukan" } });
    await page.goto("/request/999");
    await expect(page.getByText("Data tidak ditemukan.")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════ CLIENT LIST
test.describe("Daftar Klien @consultant", () => {
  const actives = [
    consultantRequest({ id_pengajuan: 11, status_pengajuan: "terjadwal", created_at: "2026-01-01T00:00:00Z", tanggal_pengajuan: dateFromToday(9), users: { nama: "Klien Pertama" } }),
    consultantRequest({ id_pengajuan: 12, status_pengajuan: "terjadwal", created_at: "2026-03-01T00:00:00Z", tanggal_pengajuan: dateFromToday(2), users: { nama: "Klien Kedua" } }),
    consultantRequest({ id_pengajuan: 13, status_pengajuan: "menunggu_pembayaran", created_at: "2026-02-01T00:00:00Z", tanggal_pengajuan: dateFromToday(5), users: { nama: "Klien Ketiga" } }),
  ];
  const names = (page) => page.locator("h3").filter({ hasText: /^Klien (Pertama|Kedua|Ketiga)$/ });

  test(...tc("CLT-001", "Daftar klien aktif & pengurutan (Terbaru, Terlama, Jadwal Paling Dekat)", {
    feature: F_CLIENTS, type: "Regression",
    input: "3 klien aktif dengan created_at & tanggal berbeda; ubah urutan via tombol filter",
    expected: "'3 Klien'; default Terbaru: Kedua, Ketiga, Pertama; Terlama: Pertama…; Paling Dekat: Kedua, Ketiga, Pertama",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/me/requests/active", { json: actives });
    await page.goto("/consultation");
    await expect(page.getByRole("heading", { name: /3\s*Klien/ })).toBeVisible();
    await expect(names(page)).toHaveText(["Klien Kedua", "Klien Ketiga", "Klien Pertama"]);
    await page.getByRole("button", { name: "filter_list" }).click();
    await page.getByRole("button", { name: /Terlama/ }).click();
    await expect(names(page)).toHaveText(["Klien Pertama", "Klien Ketiga", "Klien Kedua"]);
    await page.getByRole("button", { name: "filter_list" }).click();
    await page.getByRole("button", { name: /Paling Dekat/ }).click();
    await expect(names(page)).toHaveText(["Klien Kedua", "Klien Ketiga", "Klien Pertama"]);
  });

  test(...tc("CLT-002", "Daftar klien kosong & error ditangani", {
    feature: F_CLIENTS, type: "Negative",
    input: "(a) GET active → [], (b) GET active → 500",
    expected: "(a) 'Klien Kosong', (b) 'Gagal memuat data klien.'",
  }), async ({ page, api }) => {
    await page.goto("/consultation");
    await expect(page.getByText("Klien Kosong")).toBeVisible();
    api.on("GET", "/consultants/me/requests/active", { status: 500, json: {} });
    await page.reload();
    await expect(page.getByText("Gagal memuat data klien.")).toBeVisible({ timeout: 15_000 });
  });
});

// ═══════════════════════════════════════════════════════════════ SCHEDULE
test.describe("Kelola Jadwal @schedule", () => {
  const cal = (page) => page.getByTestId("monthly-calendar");
  const nextMonth = () => {
    const [y, m] = dateFromToday(0).split("-").map(Number);
    const d = new Date(y, m, 1);
    return { label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }), prefix: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
  };
  async function openDayNextMonth(page, day) {
    await cal(page).getByRole("button", { name: "chevron_right" }).click();
    await expect(cal(page)).toContainText(nextMonth().label);
    await cal(page).getByRole("button", { name: String(day), exact: true }).click();
  }
  async function chooseTime(page, label, time) {
    const modal = page.getByTestId("add-slot-modal");
    await modal.locator("div.space-y-3", { has: page.locator("label", { hasText: new RegExp(`^${label}$`) }) }).locator("div.cursor-pointer").first().click();
    await modal.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${time}$`) }).click();
  }

  test(...tc("SCH-001", "Halaman jadwal menampilkan status ketersediaan & kalender bulan berjalan", {
    feature: F_SCHED, type: "E2E",
    input: "Buka /schedule (stats.is_active=true)",
    expected: "'Status Konsultasi', 'Aktif Menerima Konsultasi', label bulan berjalan pada kalender",
    tags: ["@mobile"],
  }), async ({ page }) => {
    await page.goto("/schedule");
    await expect(page.getByTestId("availability-toggle-section")).toContainText("Aktif Menerima Konsultasi");
    const [y, m] = dateFromToday(0).split("-").map(Number);
    await expect(cal(page)).toContainText(new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }));
  });

  test(...tc("SCH-002", "Menambah slot jadwal baru", {
    feature: F_SCHED, type: "E2E",
    input: "Bulan depan tgl 15 → Mulai 09:00, Selesai 12:00, status Tersedia → 'Tambah Slot'",
    expected: "POST /consultants/schedules {tanggal:'<bulan depan>-15', jam_mulai:'09:00:00', jam_selesai:'12:00:00', status_tersedia:true}; alert 'Jadwal baru berhasil ditambahkan!'",
    tags: ["@smoke"],
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/consultants/schedules", { json: { data: { id_jadwal: 400 } } });
    await page.goto("/schedule");
    await openDayNextMonth(page, 15);
    await expect(page.getByText("Tambah Jadwal")).toBeVisible();
    await chooseTime(page, "Mulai", "09:00");
    await chooseTime(page, "Selesai", "12:00");
    await page.getByTestId("schedule-save-btn").click();
    await dialogs.waitFor("Jadwal baru berhasil ditambahkan!");
    expect(api.calls("POST", "/consultants/schedules")[0].body).toEqual({ tanggal: `${nextMonth().prefix}-15`, jam_mulai: "09:00:00", jam_selesai: "12:00:00", status_tersedia: true });
  });

  test(...tc("SCH-003", "Mengubah slot yang sudah ada menjadi 'Libur / Tutup'", {
    feature: F_SCHED, type: "E2E",
    input: "Slot id 410 di bulan depan tgl 10 (08:00–10:00) → status 'Libur / Tutup' → 'Simpan Perubahan'",
    expected: "Modal 'Edit Jadwal' terisi jam lama; PUT /consultants/schedules/410 {status_tersedia:false}; alert 'Jadwal berhasil diperbarui!'",
  }), async ({ page, api, dialogs }) => {
    api.on("GET", "/consultants/me/schedules", { json: [{ id_jadwal: 410, tanggal: `${nextMonth().prefix}-10`, jam_mulai: "08:00:00", jam_selesai: "10:00:00", status_tersedia: true, nama_klien: null }] });
    api.on("PUT", "/consultants/schedules/410", { json: { data: {} } });
    await page.goto("/schedule");
    await openDayNextMonth(page, 10);
    await expect(page.getByText("Edit Jadwal")).toBeVisible();
    await expect(page.getByTestId("add-slot-modal")).toContainText("08:00");
    const modal = page.getByTestId("add-slot-modal");
    await modal.locator("div.space-y-3", { has: page.locator("label", { hasText: "Status Slot" }) }).locator("div.cursor-pointer").first().click();
    await modal.locator(".max-h-60 > div").filter({ hasText: "Libur / Tutup" }).click();
    await page.getByTestId("schedule-save-btn").click();
    await dialogs.waitFor("Jadwal berhasil diperbarui!");
    expect(api.calls("PUT", "/consultants/schedules/410")[0].body).toMatchObject({ jam_mulai: "08:00:00", jam_selesai: "10:00:00", status_tersedia: false });
  });

  test(...tc("SCH-004", "Slot yang sudah dibooking klien bersifat read-only", {
    feature: F_SCHED, type: "Regression",
    input: "Slot bulan depan tgl 12 dengan nama_klien='Rina'",
    expected: "Modal 'Detail Jadwal', pesan 'Jadwal yang sudah dipesan tidak dapat diubah kembali.', tanpa tombol simpan",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/me/schedules", { json: [{ id_jadwal: 411, tanggal: `${nextMonth().prefix}-12`, jam_mulai: "08:00:00", jam_selesai: "10:00:00", status_tersedia: false, nama_klien: "Rina" }] });
    await page.goto("/schedule");
    await openDayNextMonth(page, 12);
    await expect(page.getByText("Detail Jadwal")).toBeVisible();
    await expect(page.getByText("Jadwal yang sudah dipesan tidak dapat diubah kembali.")).toBeVisible();
    await expect(page.getByTestId("schedule-save-btn")).toHaveCount(0);
  });

  test(...tc("SCH-005", "Jam selesai lebih awal dari jam mulai ditolak", {
    feature: F_SCHED, type: "Negative",
    input: "Bulan depan tgl 16, Mulai 12:00, Selesai 09:00 → 'Tambah Slot'",
    expected: "Pesan validasi tampil; tidak ada POST /consultants/schedules",
  }), async ({ page, api }) => {
    knownDefect("BUG-15");
    api.on("POST", "/consultants/schedules", { json: { data: {} } });
    await page.goto("/schedule");
    await openDayNextMonth(page, 16);
    await chooseTime(page, "Mulai", "12:00");
    await chooseTime(page, "Selesai", "09:00");
    await page.getByTestId("schedule-save-btn").click();
    await page.waitForTimeout(600);
    expect(api.calls("POST", "/consultants/schedules")).toHaveLength(0);
  });

  test(...tc("SCH-006", "Tidak dapat menambah slot pada tanggal yang sudah lewat", {
    feature: F_SCHED, type: "Negative",
    input: "Navigasi ke bulan lalu, klik tanggal 1",
    expected: "Modal tambah jadwal tidak terbuka / tanggal nonaktif",
  }), async ({ page }) => {
    knownDefect("BUG-15");
    await page.goto("/schedule");
    await cal(page).getByRole("button", { name: "chevron_left" }).click();
    await cal(page).getByRole("button", { name: "1", exact: true }).click();
    await expect(page.getByTestId("add-slot-modal")).toHaveCount(0, { timeout: 2000 });
  });

  test(...tc("SCH-007", "Toggle 'Status Konsultasi' tersimpan ke server", {
    feature: F_SCHED, type: "Regression",
    input: "Klik toggle ketersediaan (aktif → nonaktif)",
    expected: "PATCH /consultants/me/active-status {is_active:false}; status tetap nonaktif setelah reload",
  }), async ({ page, api }) => {
    knownDefect("BUG-08");
    api.on("PATCH", "/consultants/me/active-status", { json: { data: {} } });
    await page.goto("/schedule");
    await page.getByTestId("availability-toggle-section").getByRole("button").click();
    await expect(page.getByText("Tidak Menerima Konsultasi")).toBeVisible();
    await expect.poll(() => api.calls("PATCH", "/consultants/me/active-status").length, { timeout: 3000 }).toBe(1);
  });

  test(...tc("SCH-008", "Gagal menambah slot (bentrok) menampilkan alert", {
    feature: F_SCHED, type: "Negative",
    input: "POST /consultants/schedules → 409",
    expected: "Alert 'Gagal menambah jadwal. Pastikan jam tidak bertabrakan.'",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/consultants/schedules", { status: 409, json: { detail: "bentrok" } });
    await page.goto("/schedule");
    await openDayNextMonth(page, 20);
    await chooseTime(page, "Mulai", "09:00");
    await chooseTime(page, "Selesai", "10:00");
    await page.getByTestId("schedule-save-btn").click();
    await dialogs.waitFor("Gagal menambah jadwal. Pastikan jam tidak bertabrakan.");
  });

  test(...tc("SCH-009", "Navigasi bulan tidak melompati bulan saat tanggal hari ini 31", {
    feature: F_SCHED, type: "Edge Case",
    input: "Jam browser diset 31 Januari 2027, klik tombol bulan berikutnya",
    expected: "Kalender menampilkan 'Februari 2027' (bukan Maret)",
  }), async ({ page }) => {
    knownDefect("BUG-32");
    await page.clock.setFixedTime(new Date("2027-01-31T10:00:00+07:00"));
    await page.goto("/schedule");
    await expect(cal(page)).toContainText("Januari 2027");
    await cal(page).getByRole("button", { name: "chevron_right" }).click();
    await expect(cal(page)).toContainText("Februari 2027");
  });

  test(...tc("SCH-010", "Menutup modal jadwal tanpa menyimpan", {
    feature: F_SCHED, type: "E2E",
    input: "Buka tanggal bulan depan → klik tombol close (×)",
    expected: "Modal tertutup, tidak ada request POST/PUT",
  }), async ({ page, api }) => {
    await page.goto("/schedule");
    await openDayNextMonth(page, 18);
    await page.getByTestId("add-slot-modal").getByRole("button", { name: "close" }).click();
    await expect(page.getByTestId("add-slot-modal")).toHaveCount(0);
    expect(api.calls("POST", "/consultants/schedules")).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════ HISTORY KONSULTAN
test.describe("Riwayat Konsultan @history", () => {
  test(...tc("CHI-001", "Riwayat konsultan mengecualikan status pending & menampilkan total selesai", {
    feature: F_HIST, type: "Regression",
    input: "history: selesai (Ana), pending (Bayu), dibatalkan (Citra); total_sesi_selesai=7",
    expected: "Badge '7 Selesai'; kartu Ana & Citra tampil; Bayu tidak tampil",
  }), async ({ page, api }) => {
    api.on("GET", "/consultants/me/history", { json: { total_sesi_selesai: 7, data: [
      { id_pengajuan: 1, status: "selesai", nama_klien: "Ana", tanggal_konsultasi: "2026-01-02", jam_mulai: "09:00:00", jam_selesai: "09:30:00" },
      { id_pengajuan: 2, status: "pending", nama_klien: "Bayu", tanggal_konsultasi: "2026-01-03", jam_mulai: "09:00:00", jam_selesai: "09:30:00" },
      { id_pengajuan: 3, status: "dibatalkan", nama_klien: "Citra", tanggal_konsultasi: "2026-01-04", jam_mulai: "09:00:00", jam_selesai: "09:30:00" },
    ] } });
    await page.goto("/history/consultant");
    await expect(page.getByText("7 Selesai")).toBeVisible();
    await expect(page.getByText("Ana", { exact: true })).toBeVisible();
    await expect(page.getByText("Citra", { exact: true })).toBeVisible();
    await expect(page.getByText("Bayu", { exact: true })).toHaveCount(0);
  });

  test(...tc("CHI-002", "Riwayat konsultan kosong", {
    feature: F_HIST, type: "Negative",
    input: "history data=[]",
    expected: "'Riwayat Kosong' & '0 Selesai'",
  }), async ({ page }) => {
    await page.goto("/history/consultant");
    await expect(page.getByText("Riwayat Kosong")).toBeVisible();
    await expect(page.getByText("0 Selesai")).toBeVisible();
  });
});
