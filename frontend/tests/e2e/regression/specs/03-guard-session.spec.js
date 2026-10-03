/**
 * F12 & F35 — Route Guard (AuthGuard), Role Guard, dan Manajemen Sesi/Token.
 */
import { test, expect, tc, knownDefect, seedSession } from "../support/fixtures.js";
import { USERS, session } from "../support/mock-data.js";

const F_GUARD = "F12 Proteksi Route & Role Guard";
const F_SESSION = "F35 Manajemen Sesi & Refresh Token";

test.describe("Proteksi route tanpa sesi @guard", () => {
  const protectedPaths = [
    "/dashboard/client", "/dashboard/consultant", "/dashboard/admin", "/consultation", "/consultation/501",
    "/history/client", "/history/consultant", "/schedule", "/setting", "/setting/profile", "/bursa",
    "/bursa/post", "/request/601",
  ];
  test(...tc("GRD-001", "Semua halaman privat (layout ber-AuthGuard) mengarahkan tamu ke login", {
    feature: F_GUARD, type: "Regression",
    input: `Buka tanpa sesi: ${protectedPaths.join(", ")}`,
    expected: "Setiap halaman redirect ke /auth/login",
    tags: ["@smoke"],
  }), async ({ page }) => {
    for (const p of protectedPaths) {
      await page.goto(p);
      await expect(page, `route ${p}`).toHaveURL(/\/auth\/login$/);
    }
  });

  for (const [id, path] of [["GRD-002", "/verification"], ["GRD-003", "/knowledge"], ["GRD-004", "/payment/501"]]) {
    test(...tc(id, `Halaman ${path} tanpa sesi diarahkan ke login`, {
      feature: F_GUARD, type: "Security",
      input: `Buka ${path} tanpa token di localStorage`,
      expected: "Redirect ke /auth/login (halaman ini memanggil API yang butuh autentikasi)",
    }), async ({ page }) => {
      knownDefect(path === "/payment/501" ? "BUG-06" : "BUG-05");
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 5000 });
    });
  }

  test(...tc("GRD-005", "Katalog /explore dapat dijelajahi tamu (endpoint katalog publik)", {
    feature: F_GUARD, type: "E2E",
    input: "Buka /explore tanpa sesi, GET /consultants/ publik",
    expected: "Kartu konsultan tampil tanpa harus login",
  }), async ({ page, api }) => {
    api.asClient();
    await page.goto("/explore");
    await expect(page.getByTestId("consultant-card").first()).toBeVisible();
  });

  test(...tc("GRD-006", "Tamu yang bertanya di Tanya AI mendapat pesan untuk login", {
    feature: F_GUARD, type: "Negative",
    input: "Tanpa sesi, kirim pesan di /ai → backend 401",
    expected: "Bubble AI berisi 'Silakan login terlebih dahulu' (tidak crash)",
  }), async ({ page, api }) => {
    api.on("GET", "/chatbot/sessions", { status: 401, json: { detail: "Token tidak valid" } });
    api.on("POST", "/chatbot/triage", { status: 401, json: { detail: "Token tidak valid" } });
    await page.goto("/ai");
    await page.getByTestId("ai-chat-input").fill("Apa itu wanprestasi?");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Silakan login terlebih dahulu/)).toBeVisible();
  });
});

test.describe("Role guard @guard", () => {
  for (const [id, role, target, home] of [
    ["GRD-007", "client", "/dashboard/consultant", "/dashboard/client"],
    ["GRD-008", "client", "/dashboard/admin", "/dashboard/client"],
    ["GRD-009", "konsultan", "/dashboard/client", "/dashboard/consultant"],
    ["GRD-010", "konsultan", "/dashboard/admin", "/dashboard/consultant"],
    ["GRD-011", "admin", "/dashboard/client", "/dashboard/admin"],
  ]) {
    test(...tc(id, `${role} yang membuka ${target} dikembalikan ke ${home}`, {
      feature: F_GUARD, type: "Regression",
      input: `Sesi ${role}, buka ${target}`,
      expected: `Redirect ke ${home}`,
    }), async ({ page, loginAs }) => {
      await loginAs(role);
      await page.goto(target);
      await expect(page).toHaveURL(new RegExp(`${home}$`));
    });
  }

  test(...tc("GRD-012", "Sesi tanpa role yang membuka dashboard diarahkan ke pemilihan role", {
    feature: F_GUARD, type: "Edge Case",
    input: "Token ada, role tidak tersimpan, buka /dashboard/client",
    expected: "Redirect ke /auth/role",
  }), async ({ page, api }) => {
    api.asClient();
    await seedSession(page, "client", { withRole: false });
    await page.goto("/dashboard/client");
    await expect(page).toHaveURL(/\/auth\/role$/);
  });

  for (const [id, role, path] of [
    ["GRD-013", "client", "/schedule"],
    ["GRD-014", "client", "/bursa"],
    ["GRD-015", "client", "/verification"],
    ["GRD-016", "konsultan", "/bursa/post"],
    ["GRD-017", "konsultan", "/knowledge"],
  ]) {
    test(...tc(id, `${role} tidak boleh membuka halaman role lain ${path}`, {
      feature: F_GUARD, type: "Security",
      input: `Sesi ${role}, buka ${path}`,
      expected: `Diarahkan kembali ke dashboard ${role} (halaman milik role lain tidak dirender)`,
    }), async ({ page, loginAs }) => {
      knownDefect("BUG-06");
      await loginAs(role);
      await page.goto(path);
      await expect(page).toHaveURL(/\/dashboard\/(client|consultant)$/, { timeout: 5000 });
    });
  }
});

test.describe("Sesi & token @session", () => {
  test(...tc("SES-001", "Access token kedaluwarsa diperbarui otomatis via refresh token lalu request diulang", {
    feature: F_SESSION, type: "Regression",
    input: "GET /users/me/profile/full → 401 sekali, POST /auth/refresh → session baru",
    expected: "Refresh dipanggil 1x dengan refresh_token lama, request diulang dengan token baru, nama user tampil",
    tags: ["@smoke"],
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    let first = true;
    api.on("GET", "/users/me/profile/full", (req) => {
      if (first) { first = false; return { status: 401, json: { detail: "Token expired" } }; }
      return { json: { ...USERS.client, nama: `Budi (${req.headers.authorization})` } };
    });
    api.on("POST", "/auth/refresh", { json: { data: { session: { ...session("client"), access_token: "access-baru" } } } });
    await page.goto("/dashboard/client");
    await expect(page.getByText("Budi (Bearer access-baru)")).toBeVisible();
    expect(api.calls("POST", "/auth/refresh")[0].body).toEqual({ refresh_token: "refresh-client-token" });
    expect(await page.evaluate(() => localStorage.getItem("ll_token"))).toBe("access-baru");
  });

  test(...tc("SES-002", "Refresh token juga invalid → sesi dibersihkan & user diarahkan ke login", {
    feature: F_SESSION, type: "Negative",
    input: "Semua request 401, POST /auth/refresh → 401",
    expected: "localStorage token dihapus dan user diarahkan ke /auth/login",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    api.on("GET", "/users/me/profile/full", { status: 401, json: { detail: "expired" } });
    api.on("GET", "/consultations/", { status: 401, json: { detail: "expired" } });
    api.on("POST", "/auth/refresh", { status: 401, json: { detail: "invalid refresh" } });
    await page.goto("/dashboard/client");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("ll_token"))).toBeNull();
    knownDefect("BUG-28");
    await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 5000 });
  });

  test(...tc("SES-003", "Beberapa request 401 bersamaan hanya memicu satu refresh", {
    feature: F_SESSION, type: "Edge Case",
    input: "Dashboard konsultan memanggil 4 endpoint paralel yang semuanya 401 pada percobaan pertama",
    expected: "POST /auth/refresh hanya dipanggil 1 kali (refreshPromise di-share)",
  }), async ({ page, api, loginAs }) => {
    await loginAs("konsultan");
    const seen = new Set();
    for (const p of ["/users/me/profile/full", "/consultants/me/dashboard-stats", "/consultants/me/requests/pending", "/consultants/me/requests/active"]) {
      api.on("GET", p, (req) => {
        if (!seen.has(p)) { seen.add(p); return { status: 401, json: {} }; }
        return { json: p.includes("requests") ? [] : p.includes("stats") ? { total_income: 0, total_klien: 0, total_klien_aktif: 0 } : USERS.konsultan };
      });
    }
    api.on("POST", "/auth/refresh", { delay: 300, json: { data: { session: session("konsultan") } } });
    await page.goto("/dashboard/consultant");
    await expect(page.getByText("Jadwal Terdekat")).toBeVisible();
    expect(api.calls("POST", "/auth/refresh")).toHaveLength(1);
  });

  test(...tc("SES-004", "Header Authorization Bearer dikirim pada setiap request API", {
    feature: F_SESSION, type: "Regression",
    input: "Sesi client, buka /dashboard/client",
    expected: "Semua request ke /api/v1 memiliki header 'Authorization: Bearer access-client-token'",
  }), async ({ page, api, loginAs }) => {
    await loginAs("client");
    await page.goto("/dashboard/client");
    await api.waitFor("GET", "/consultations/");
    for (const r of api.requests) expect(r.headers.authorization, `${r.method} ${r.path}`).toBe("Bearer access-client-token");
  });
});
