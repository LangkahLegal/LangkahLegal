/**
 * LIVE API — uji langsung ke backend FastAPI LangkahLegal (Supabase sungguhan).
 *
 * SEMUA test di sini NON-DESTRUKTIF: hanya GET publik, validasi input yang ditolak sebelum
 * menyentuh database, akses tanpa/dengan token palsu, dan ID yang tidak ada.
 * Test terautentikasi berjalan hanya jika kredensial E2E_* tersedia di .env.e2e.
 *
 * Jalankan: backend di http://127.0.0.1:8000 lalu `npm run test:live-api`
 */
import { test as base, expect } from "@playwright/test";

const API = "/api/v1";
const F_LIVE = "F36 Kontrak & Keamanan API Backend (Live)";
const tc = (id, title, meta) => [
  `${id} ${title}`,
  {
    tag: ["@live", ...(meta.tags || [])],
    annotation: [
      { type: "feature", description: meta.feature || F_LIVE },
      { type: "category", description: meta.type },
      { type: "input", description: meta.input },
      { type: "expected", description: meta.expected },
    ],
  },
];
const knownDefect = (id) => {
  base.info().annotations.push({ type: "bug", description: id });
  if (!process.env.E2E_STRICT) base.fail(true, `Known defect ${id}`);
};

const test = base;
let backendUp = false;

test.beforeAll(async ({ request }) => {
  try {
    const res = await request.get("/health", { timeout: 15_000 });
    backendUp = res.ok();
  } catch {
    backendUp = false;
  }
});
test.beforeEach(() => test.skip(!backendUp, "Backend tidak berjalan di PLAYWRIGHT_API_ORIGIN (default http://127.0.0.1:8000)"));

test.describe("Live API — publik & kontrak", () => {
  test(...tc("LIVE-001", "Health check backend & koneksi database", {
    type: "Smoke", input: "GET /health",
    expected: "200 {status:'ok', database:'connected'}",
  }), async ({ request }) => {
    const res = await request.get("/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", database: "connected" });
  });

  test(...tc("LIVE-002", "Kontrak katalog konsultan sesuai yang dipakai frontend", {
    type: "Contract", input: "GET /api/v1/consultants/",
    expected: "200, data array; tiap item punya id, name, spec, rating, reviews, status, status_verifikasi, tarif_per_sesi; waktu respons < 5 dtk",
  }), async ({ request }) => {
    const t0 = Date.now();
    const res = await request.get(`${API}/consultants/`);
    const elapsed = Date.now() - t0;
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    for (const item of json.data) {
      for (const k of ["id", "name", "spec", "rating", "reviews", "status", "status_verifikasi", "tarif_per_sesi"]) expect(item, `item ${item.id}`).toHaveProperty(k);
    }
    test.info().annotations.push({ type: "actual", description: `${json.data.length} konsultan aktif, ${elapsed} ms; nama null: ${json.data.filter((c) => !c.name).length}` });
    expect(elapsed).toBeLessThan(5000);
  });

  test(...tc("LIVE-003", "Parameter filter berisi payload injeksi tidak menyebabkan error server", {
    type: "Security", input: "GET /consultants/?spesialisasi=' OR 1=1 --  dan  %25_%25",
    expected: "200 dengan data array (tidak 500, tidak membocorkan error SQL)",
  }), async ({ request }) => {
    for (const v of ["' OR 1=1 --", "%_%", "<script>alert(1)</script>"]) {
      const res = await request.get(`${API}/consultants/`, { params: { spesialisasi: v } });
      expect(res.status(), v).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data), v).toBe(true);
      expect(JSON.stringify(json).toLowerCase(), v).not.toMatch(/syntax error|postgres|traceback/);
    }
  });

  test(...tc("LIVE-004", "Detail konsultan yang tidak ada → 404; ID non-numerik → 422", {
    type: "Negative", input: "GET /consultants/999999999 ; GET /consultants/abc",
    expected: "404 detail 'Konsultan tidak ditemukan' ; 422 validation error",
  }), async ({ request }) => {
    const nf = await request.get(`${API}/consultants/999999999`);
    expect(nf.status()).toBe(404);
    expect((await nf.json()).detail).toBe("Konsultan tidak ditemukan");
    expect((await request.get(`${API}/consultants/abc`)).status()).toBe(422);
  });

  test(...tc("LIVE-005", "Booked-slots konsultan yang tidak ada mengembalikan array kosong", {
    type: "Contract", input: "GET /consultations/999999999/booked-slots",
    expected: "200 {data: []}",
  }), async ({ request }) => {
    const res = await request.get(`${API}/consultations/999999999/booked-slots`);
    expect(res.status()).toBe(200);
    expect((await res.json()).data).toEqual([]);
  });
});

test.describe("Live API — autentikasi & otorisasi", () => {
  test(...tc("LIVE-006", "Login dengan kredensial salah ditolak tanpa error server", {
    type: "Negative", input: "POST /auth/login-password {email:'tidak.ada.e2e@example.com', password:'SalahSekali123'}",
    expected: "Status 400/401 dengan field detail, bukan 500; tidak ada session",
  }), async ({ request }) => {
    const res = await request.post(`${API}/auth/login-password`, { data: { email: "tidak.ada.e2e@example.com", password: "SalahSekali123" } });
    expect([400, 401]).toContain(res.status());
    const json = await res.json();
    expect(json.detail).toBeTruthy();
    expect(json.data?.session).toBeUndefined();
    test.info().annotations.push({ type: "actual", description: `${res.status()} detail='${json.detail}'` });
  });

  test(...tc("LIVE-007", "Payload login/signup tidak lengkap ditolak validasi (422)", {
    type: "Negative", input: "POST /auth/login-password {email} ; POST /auth/signup {email,password} tanpa name/role",
    expected: "422 untuk keduanya (tidak ada akun yang dibuat)",
  }), async ({ request }) => {
    expect((await request.post(`${API}/auth/login-password`, { data: { email: "a@example.com" } })).status()).toBe(422);
    expect((await request.post(`${API}/auth/signup`, { data: { email: "a@example.com", password: "x" } })).status()).toBe(422);
  });

  test(...tc("LIVE-008", "Endpoint privat menolak request tanpa token", {
    type: "Security",
    input: "Tanpa header Authorization: GET /auth/profile, /users/me/profile/full, /consultations/, /cases/, /consultants/me/schedules, /admin/stats, /chatbot/sessions; POST /cases/, /chatbot/triage, /payments/create-transaction; PATCH /consultants/me/active-status",
    expected: "Semua 401/403 (tidak ada yang 200/500)",
    tags: ["@smoke"],
  }), async ({ request }) => {
    const matrix = [
      ["GET", "/auth/profile"], ["GET", "/users/me/profile/full"], ["GET", "/consultations/"], ["GET", "/cases/"],
      ["GET", "/consultants/me/schedules"], ["GET", "/admin/stats"], ["GET", "/admin/consultants"], ["GET", "/chatbot/sessions"],
      ["POST", "/cases/"], ["POST", "/chatbot/triage", { query: "halo" }], ["POST", "/payments/create-transaction", { id_pengajuan: 1 }],
      ["PATCH", "/consultants/me/active-status", { is_active: true }],
    ];
    const results = [];
    for (const [method, path, data] of matrix) {
      const res = await request.fetch(`${API}${path}`, { method, data });
      results.push(`${method} ${path} → ${res.status()}`);
    }
    test.info().annotations.push({ type: "actual", description: results.join("; ") });
    for (const r of results) expect(r, r).toMatch(/→ (401|403)$/);
  });

  test(...tc("LIVE-009", "Token palsu/kedaluwarsa ditolak", {
    type: "Security", input: "Authorization: Bearer token.palsu.e2e ke GET /auth/profile & /admin/stats",
    expected: "401/403, tidak 200/500",
  }), async ({ request }) => {
    const headers = { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.palsu" };
    for (const p of ["/auth/profile", "/admin/stats"]) {
      const res = await request.get(`${API}${p}`, { headers });
      expect([401, 403], `${p} → ${res.status()}`).toContain(res.status());
    }
  });

  test(...tc("LIVE-010", "Toggle slot jadwal wajib autentikasi & kepemilikan", {
    type: "Security",
    input: "PATCH /consultants/schedules/999999999/toggle {status_tersedia:false} TANPA token (ID tidak ada → tidak mengubah data)",
    expected: "401/403 — endpoint mengubah data harus terautentikasi",
    tags: ["@smoke"],
  }), async ({ request }) => {
    knownDefect("BUG-03");
    const res = await request.patch(`${API}/consultants/schedules/999999999/toggle`, { data: { status_tersedia: false } });
    test.info().annotations.push({ type: "actual", description: `HTTP ${res.status()} ${(await res.text()).slice(0, 120)}` });
    expect([401, 403]).toContain(res.status());
  });

  test(...tc("LIVE-011", "CORS hanya mengizinkan origin terdaftar", {
    type: "Security",
    input: "Preflight OPTIONS /api/v1/consultants/ dengan Origin http://localhost:3000 dan https://evil.example",
    expected: "localhost:3000 mendapat Access-Control-Allow-Origin; evil.example tidak",
  }), async ({ request }) => {
    const pre = (origin) => request.fetch(`${API}/consultants/`, { method: "OPTIONS", headers: { Origin: origin, "Access-Control-Request-Method": "GET" } });
    const ok = await pre("http://localhost:3000");
    expect(ok.headers()["access-control-allow-origin"]).toBe("http://localhost:3000");
    const evil = await pre("https://evil.example");
    expect(evil.headers()["access-control-allow-origin"]).toBeUndefined();
  });

  test(...tc("LIVE-012", "Webhook Midtrans menolak notifikasi palsu", {
    type: "Security",
    input: "POST /payments/notification {order_id:'E2E-FAKE-ORDER', transaction_status:'settlement', signature_key:'palsu'}",
    expected: "4xx 'Verifikasi notifikasi gagal' — status pembayaran tidak dapat dipalsukan",
  }), async ({ request }) => {
    const res = await request.post(`${API}/payments/notification`, {
      data: { order_id: "E2E-FAKE-ORDER", transaction_status: "settlement", status_code: "200", gross_amount: "150000.00", signature_key: "palsu" },
      timeout: 30_000,
    });
    test.info().annotations.push({ type: "actual", description: `HTTP ${res.status()} ${(await res.text()).slice(0, 120)}` });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test(...tc("LIVE-013", "Body JSON rusak ditangani dengan 4xx", {
    type: "Negative", input: "POST /auth/login-password dengan body '{rusak' (Content-Type JSON)",
    expected: "422/400, bukan 500",
  }), async ({ request }) => {
    const res = await request.post(`${API}/auth/login-password`, { headers: { "Content-Type": "application/json" }, data: "{rusak" });
    expect([400, 422]).toContain(res.status());
  });
});

// ─── Opsional: hanya berjalan bila kredensial akun uji tersedia (read-only) ───
const creds = {
  client: [process.env.E2E_CLIENT_EMAIL, process.env.E2E_CLIENT_PASSWORD],
  konsultan: [process.env.E2E_CONSULTANT_EMAIL, process.env.E2E_CONSULTANT_PASSWORD],
};
async function loginToken(request, [email, password]) {
  const res = await request.post(`${API}/auth/login-password`, { data: { email, password } });
  expect(res.status()).toBe(200);
  return (await res.json()).data.session.access_token;
}

test.describe("Live API — akun uji (read-only)", () => {
  test(...tc("LIVE-020", "Client login & hanya bisa mengakses resource miliknya", {
    type: "E2E",
    input: "Login akun client uji → GET /auth/profile, /consultations/, /admin/stats, /cases/",
    expected: "profile.role='client'; /consultations/ 200 array; /admin/stats 403; /cases/ 403",
  }), async ({ request }) => {
    test.skip(!creds.client[0], "E2E_CLIENT_EMAIL/PASSWORD tidak diset di .env.e2e");
    const token = await loginToken(request, creds.client);
    const h = { Authorization: `Bearer ${token}` };
    expect((await (await request.get(`${API}/auth/profile`, { headers: h })).json()).data.role).toBe("client");
    const list = await request.get(`${API}/consultations/`, { headers: h });
    expect(list.status()).toBe(200);
    expect((await request.get(`${API}/admin/stats`, { headers: h })).status()).toBe(403);
    expect((await request.get(`${API}/cases/`, { headers: h })).status()).toBe(403);
  });

  test(...tc("LIVE-021", "Konsultan login & dapat melihat bursa serta statistiknya", {
    type: "E2E",
    input: "Login akun konsultan uji → GET /cases/, /consultants/me/dashboard-stats, /admin/stats",
    expected: "/cases/ 200; stats 200 {total_income,total_klien,total_klien_aktif}; /admin/stats 403",
  }), async ({ request }) => {
    test.skip(!creds.konsultan[0], "E2E_CONSULTANT_EMAIL/PASSWORD tidak diset di .env.e2e");
    const token = await loginToken(request, creds.konsultan);
    const h = { Authorization: `Bearer ${token}` };
    expect((await request.get(`${API}/cases/`, { headers: h })).status()).toBe(200);
    const stats = await request.get(`${API}/consultants/me/dashboard-stats`, { headers: h });
    expect(stats.status()).toBe(200);
    expect(await stats.json()).toHaveProperty("total_income");
    expect((await request.get(`${API}/admin/stats`, { headers: h })).status()).toBe(403);
  });
});
