/**
 * F26 Tanya AI (Chatbot RAG "Visi") & riwayat sesi chat.
 */
import { test, expect, tc, knownDefect } from "../support/fixtures.js";

const F_AI = "F26 Tanya AI (Chatbot Hukum)";

const triageReply = (o = {}) => ({
  json: {
    session_id: "sess-1",
    jawaban: "Berdasarkan **UU ITE**, penyebaran konten bermuatan penghinaan dapat dipidana.",
    type: "text",
    pasal_referensi: [{ nama_uu: "UU ITE", pasal_bagian: "Pasal 27 ayat (3)", similarity: 0.873 }],
    disclaimer: "Jawaban ini bukan nasihat hukum resmi.",
    ...o,
  },
});

test.describe("Tanya AI @ai", () => {
  test.beforeEach(async ({ loginAs }) => loginAs("client"));
  const input = (page) => page.getByTestId("ai-chat-input");
  const aiMsgs = (page) => page.getByTestId("ai-message");
  const userMsgs = (page) => page.getByTestId("user-message");

  test(...tc("AI-001", "Halaman Tanya AI menampilkan header & pesan sambutan", {
    feature: F_AI, type: "E2E",
    input: "Buka /ai",
    expected: "Header 'Visi' status 'Online', 1 bubble AI berisi 'Halo! Saya Visi', input chat kosong & tombol kirim nonaktif",
    tags: ["@smoke", "@mobile"],
  }), async ({ page }) => {
    await page.goto("/ai");
    await expect(page.getByRole("heading", { name: "Visi" })).toBeVisible();
    await expect(page.getByText("Online")).toBeVisible();
    await expect(aiMsgs(page)).toHaveCount(1);
    await expect(aiMsgs(page).first()).toContainText("Halo! Saya Visi");
    await expect(page.getByRole("button", { name: "send" })).toBeDisabled();
  });

  test(...tc("AI-002", "Kirim pertanyaan dengan Enter → indikator mengetik → jawaban AI + referensi pasal", {
    feature: F_AI, type: "E2E",
    input: "Ketik 'Apakah menghina di medsos bisa dipidana?' lalu Enter (response delay 800ms)",
    expected: "Bubble user muncul, indikator 'Visi sedang membaca kronologi Anda...', POST /chatbot/triage {query, session_id:null, kategori:null}; jawaban dengan <strong>UU ITE</strong>, referensi 'Pasal 27 ayat (3)' 87%, disclaimer",
    tags: ["@smoke"],
  }), async ({ page, api }) => {
    api.on("POST", "/chatbot/triage", { delay: 800, ...triageReply() });
    await page.goto("/ai");
    await input(page).fill("Apakah menghina di medsos bisa dipidana?");
    await input(page).press("Enter");
    await expect(userMsgs(page)).toContainText("Apakah menghina di medsos bisa dipidana?");
    await expect(page.getByText("Visi sedang membaca kronologi Anda...")).toBeVisible();
    await expect(input(page)).toHaveValue("");
    await expect(aiMsgs(page).last().locator("strong")).toHaveText("UU ITE");
    await expect(page.getByText("Pasal 27 ayat (3)", { exact: false })).toBeVisible();
    await expect(page.getByText("87%")).toBeVisible();
    await expect(page.getByText("Jawaban ini bukan nasihat hukum resmi.")).toBeVisible();
    expect(api.calls("POST", "/chatbot/triage")[0].body).toEqual({ query: "Apakah menghina di medsos bisa dipidana?", session_id: null, kategori: null });
  });

  test(...tc("AI-003", "Pesan lanjutan memakai session_id dari jawaban pertama", {
    feature: F_AI, type: "Regression",
    input: "Kirim 2 pesan berturut-turut; jawaban pertama session_id='sess-1'",
    expected: "Request kedua membawa session_id='sess-1'",
  }), async ({ page, api }) => {
    api.on("POST", "/chatbot/triage", triageReply());
    await page.goto("/ai");
    await input(page).fill("Pertanyaan pertama");
    await input(page).press("Enter");
    await expect(aiMsgs(page)).toHaveCount(1);
    await input(page).fill("Pertanyaan kedua");
    await input(page).press("Enter");
    await expect.poll(() => api.calls("POST", "/chatbot/triage").length).toBe(2);
    expect(api.calls("POST", "/chatbot/triage")[1].body.session_id).toBe("sess-1");
  });

  test(...tc("AI-004", "Shift+Enter membuat baris baru tanpa mengirim; input kosong/spasi tidak terkirim", {
    feature: F_AI, type: "Edge Case",
    input: "Ketik 'Baris 1' + Shift+Enter + 'Baris 2'; lalu kosongkan & ketik '   ' + Enter",
    expected: "Nilai input berisi newline & tidak ada request; input spasi tidak mengirim request dan tombol kirim nonaktif",
  }), async ({ page, api }) => {
    await page.goto("/ai");
    await input(page).fill("Baris 1");
    await input(page).press("Shift+Enter");
    await input(page).pressSequentially("Baris 2");
    await expect(input(page)).toHaveValue("Baris 1\nBaris 2");
    await input(page).fill("   ");
    await input(page).press("Enter");
    await expect(page.getByRole("button", { name: "send" })).toBeDisabled();
    await page.waitForTimeout(300);
    expect(api.calls("POST", "/chatbot/triage")).toHaveLength(0);
  });

  for (const [id, status, re] of [
    ["AI-005", 429, /terlalu banyak permintaan/],
    ["AI-006", 500, /kendala pada sistem internal/],
    ["AI-007", "network", /Koneksi terputus/],
  ]) {
    test(...tc(id, `Error ${status} dari layanan AI ditampilkan sebagai pesan ramah`, {
      feature: F_AI, type: "Negative",
      input: status === "network" ? "Request /chatbot/triage gagal di jaringan" : `POST /chatbot/triage → HTTP ${status}`,
      expected: `Bubble AI error berisi pesan yang sesuai (${re}); input dapat dipakai lagi`,
    }), async ({ page, api }) => {
      api.on("POST", "/chatbot/triage", status === "network" ? { abort: true } : { status, json: { detail: "x" } });
      await page.goto("/ai");
      await input(page).fill("Halo");
      await input(page).press("Enter");
      await expect(aiMsgs(page).last()).toContainText(re);
      await expect(input(page)).toBeEditable();
    });
  }

  test(...tc("AI-008", "Rekomendasi konsultan dari AI tampil sebagai kartu & tombol 'Jadwalkan'", {
    feature: F_AI, type: "E2E",
    input: "Jawaban type='consultant_list' dengan 1 konsultan (id 10, tarif 150000, rating 4.8)",
    expected: "Judul 'Rekomendasi Konsultan:', nama, 'Rp 150.000', '4.8'; klik 'Jadwalkan' membuka /explore/10 di tab baru",
  }), async ({ page, api, context }) => {
    api.on("POST", "/chatbot/triage", triageReply({
      type: "consultant_list",
      jawaban: "Berikut konsultan yang cocok:",
      pasal_referensi: [],
      consultants: [{ id_konsultan: 10, nama_lengkap: "Siti Rahma, S.H., M.H.", spesialisasi: "Perdata", tarif_per_sesi: 150000, pengalaman_tahun: 7, foto_profil: null, avg_rating: 4.8, total_reviews: 12 }],
    }));
    await page.goto("/ai");
    await input(page).fill("Carikan pengacara perdata");
    await input(page).press("Enter");
    await expect(page.getByText("Rekomendasi Konsultan:")).toBeVisible();
    await expect(page.getByText("Siti Rahma, S.H., M.H.")).toBeVisible();
    await expect(page.getByText(/Rp\s?150\.000/)).toBeVisible();
    await expect(page.getByText("4.8")).toBeVisible();
    const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: "Jadwalkan" }).click()]);
    await popup.waitForLoadState("domcontentloaded");
    expect(popup.url()).toMatch(/\/explore\/10$/);
  });

  test(...tc("AI-009", "Quick reply muncul saat AI menanyakan bukti & dapat diklik untuk mengirim", {
    feature: F_AI, type: "E2E",
    input: "Jawaban AI mengandung kata 'bukti' → klik 'Ya, saya punya buktinya'",
    expected: "2 tombol quick reply tampil; klik mengirim POST triage dengan query 'Ya, saya punya buktinya'",
  }), async ({ page, api }) => {
    api.on("POST", "/chatbot/triage", triageReply({ jawaban: "Apakah Anda memiliki bukti tangkapan layar?", pasal_referensi: [] }));
    await page.goto("/ai");
    await input(page).fill("Saya difitnah");
    await input(page).press("Enter");
    const qr = page.getByRole("button", { name: "Ya, saya punya buktinya" });
    await expect(qr).toBeVisible();
    await expect(page.getByRole("button", { name: "Saya tidak punya bukti" })).toBeVisible();
    await qr.click();
    await expect.poll(() => api.calls("POST", "/chatbot/triage").length).toBe(2);
    expect(api.calls("POST", "/chatbot/triage")[1].body.query).toBe("Ya, saya punya buktinya");
  });

  test(...tc("AI-010", "Jawaban AI berisi HTML/link berbahaya tidak dieksekusi (sanitasi markdown)", {
    feature: F_AI, type: "Security",
    input: "jawaban='<img src=x onerror=alert(1)> [klik](javascript:alert(2)) <script>alert(3)</script>'",
    expected: "Tidak ada elemen <img>/<script> hasil injeksi, href link bukan 'javascript:', tidak ada dialog",
  }), async ({ page, api, dialogs }) => {
    api.on("POST", "/chatbot/triage", triageReply({ jawaban: "<img src=x onerror=alert(1)> [klik](javascript:alert(2)) <script>alert(3)</script>", pasal_referensi: [] }));
    await page.goto("/ai");
    await input(page).fill("tes");
    await input(page).press("Enter");
    const last = aiMsgs(page).last();
    await expect(last.getByRole("link", { name: "klik" })).toBeVisible();
    expect(await last.getByRole("link", { name: "klik" }).getAttribute("href")).not.toMatch(/^javascript:/i);
    await expect(last.locator("img, script")).toHaveCount(0);
    await last.getByRole("link", { name: "klik" }).click().catch(() => {});
    await page.waitForTimeout(300);
    expect(dialogs.messages).toHaveLength(0);
  });

  test(...tc("AI-011", "Tidak bisa mengirim pesan baru selama AI masih memproses", {
    feature: F_AI, type: "Edge Case",
    input: "Kirim pesan 1 (delay 1.5s), segera ketik pesan 2 + Enter",
    expected: "Hanya 1 request triage selama pesan 1 diproses",
  }), async ({ page, api }) => {
    api.on("POST", "/chatbot/triage", { delay: 1500, ...triageReply() });
    await page.goto("/ai");
    await input(page).fill("Pesan 1");
    await input(page).press("Enter");
    await input(page).fill("Pesan 2");
    await input(page).press("Enter");
    await page.waitForTimeout(500);
    expect(api.calls("POST", "/chatbot/triage")).toHaveLength(1);
  });

  test(...tc("AI-013", "Layout tetap terbaca saat CDN font ikon (Google Fonts) gagal dimuat", {
    feature: F_AI, type: "Edge Case",
    input: "Blokir fonts.googleapis.com, buka riwayat chat dengan sesi 'Sengketa Tanah'",
    expected: "Judul sesi tetap terlihat (lebar > 0); nama ikon tidak merusak layout",
  }), async ({ page, api }) => {
    knownDefect("BUG-26");
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    api.on("GET", "/chatbot/sessions", { json: { sessions: [{ id: "s1", title: "Sengketa Tanah", updated_at: new Date().toISOString() }] } });
    await page.goto("/ai");
    await page.getByRole("button", { name: "Toggle riwayat chat" }).click();
    await expect(page.getByText("Sengketa Tanah")).toBeVisible({ timeout: 3000 });
  });

  test(...tc("AI-012", "Riwayat sesi: daftar, buka sesi lama, hapus (konfirmasi 2x), mulai baru", {
    feature: F_AI, type: "E2E",
    input: "2 sesi tersimpan → buka 'Sengketa Tanah' → hapus 'Kasus PHK' (klik 2x) → 'Konsultasi Baru'",
    expected: "Pesan sesi lama dimuat dari GET /chatbot/sessions/s1/messages; DELETE /chatbot/sessions/s2 hanya setelah klik ke-2; 'Konsultasi Baru' menampilkan sambutan lagi",
  }), async ({ page, api }) => {
    const now = new Date().toISOString();
    api.on("GET", "/chatbot/sessions", { json: { sessions: [{ id: "s1", title: "Sengketa Tanah", updated_at: now }, { id: "s2", title: "Kasus PHK", updated_at: now }] } });
    api.on("GET", "/chatbot/sessions/s1/messages", { json: { messages: [
      { id: "m1", role: "user", content: "Tanah saya diserobot", created_at: now, metadata: null },
      { id: "m2", role: "ai", content: "Anda dapat menggugat berdasarkan Pasal 1365 KUHPerdata.", created_at: now, metadata: { type: "text" } },
    ] } });
    api.on("DELETE", "/chatbot/sessions/s2", { json: { ok: true } });
    await page.goto("/ai");
    await page.getByRole("button", { name: "Toggle riwayat chat" }).click();
    await expect(page.getByText("2 sesi konsultasi")).toBeVisible();
    await page.locator("div.group", { hasText: "Sengketa Tanah" }).click();
    await expect(page.getByText("Tanah saya diserobot")).toBeVisible();
    await expect(page.getByText("Pasal 1365 KUHPerdata", { exact: false })).toBeVisible();
    const row = page.locator("div.group", { hasText: "Kasus PHK" });
    await row.hover();
    await row.getByRole("button").click();
    expect(api.calls("DELETE", "/chatbot/sessions/s2")).toHaveLength(0);
    await row.getByRole("button", { name: "delete_forever" }).click();
    await expect(page.getByText("Kasus PHK")).toHaveCount(0);
    expect(api.calls("DELETE", "/chatbot/sessions/s2")).toHaveLength(1);
    await page.getByRole("button", { name: /Konsultasi Baru/ }).click();
    await expect(aiMsgs(page).first()).toContainText("Halo! Saya Visi");
  });
});
