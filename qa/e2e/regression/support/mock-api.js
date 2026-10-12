/**
 * MockApi — mencegat semua request ke backend (`/api/v1/*`) di level jaringan browser.
 *
 * - Handler didaftarkan dengan `api.on(method, pathPattern, response)`.
 *   Handler yang didaftarkan TERAKHIR menang (sehingga test bisa override default).
 * - `response` bisa berupa objek `{ status, json, body, headers, delay, abort }`
 *   atau fungsi `(req) => objek`.
 * - Setiap request direkam di `api.requests` agar test bisa memverifikasi payload.
 */
import {
  USERS,
  session,
  CATALOG,
  ADMIN_STATS,
  adminConsultant,
  adminDocument,
} from "./mock-data.js";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

function parseBody(request) {
  const raw = request.postData();
  if (!raw) return null;
  const type = request.headers()["content-type"] || "";
  if (type.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

/** Ambil nilai field dari body multipart/form-data mentah. */
export function multipartField(raw, name) {
  if (typeof raw !== "string") return undefined;
  const re = new RegExp(`name="${name}"(?:; filename="[^"]*")?\\r\\n(?:[^\\r\\n]+\\r\\n)*\\r\\n([\\s\\S]*?)\\r\\n--`, "m");
  const m = raw.match(re);
  return m ? m[1] : undefined;
}

/** Ambil semua nama file yang dikirim pada field tertentu (multipart). */
export function multipartFilenames(raw, name) {
  if (typeof raw !== "string") return [];
  const re = new RegExp(`name="${name}"; filename="([^"]*)"`, "g");
  return [...raw.matchAll(re)].map((m) => m[1]);
}


/* ------------------------------------------------------------------------------------------
 * Emulasi pemrosesan sisi server.
 *
 * Filter, urutan, dan paginasi daftar dikerjakan backend (lihat qa/api/test_listing.py untuk
 * pengujian logika aslinya). Agar mock statis di tiap test tetap bermakna, respons mock
 * diproses di sini dengan aturan yang sama seperti backend.
 * ---------------------------------------------------------------------------------------- */
const includesText = (value, keyword) => String(value ?? "").toLowerCase().includes(keyword);

const isPastSession = (row) => {
  if (typeof row.sudah_lewat === "boolean") return row.sudah_lewat;
  if (!row.tanggal_pengajuan || !row.jam_mulai) return false;
  return new Date(`${String(row.tanggal_pengajuan).split("T")[0]}T${row.jam_mulai}`) < new Date();
};

const DASHBOARD_STATUSES = ["pending", "menunggu_pembayaran", "terjadwal", "ditolak"];
const HISTORY_PRIORITY = ["terjadwal", "pending", "menunggu_pembayaran"];
const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);

function emulateCatalog(query, json) {
  let data = json.data;
  const keyword = (query.search || "").toLowerCase();
  if (keyword) data = data.filter((c) => includesText(c.name, keyword) || includesText(c.spec, keyword));
  if (query.verified === "terverifikasi") data = data.filter((c) => c.status_verifikasi === "terverifikasi");
  if (query.verified === "non-verified") data = data.filter((c) => c.status_verifikasi !== "terverifikasi");
  if (query.min_price !== undefined) data = data.filter((c) => (c.tarif_per_sesi || 0) >= Number(query.min_price));
  if (query.max_price !== undefined) data = data.filter((c) => (c.tarif_per_sesi || 0) <= Number(query.max_price));

  const total = data.length;
  if (query.page) {
    const size = Number(query.page_size || 20);
    const start = (Number(query.page) - 1) * size;
    data = data.slice(start, start + size);
  }
  return { ...json, data, total };
}

function emulateCases(query, json) {
  const kategori = (query.kategori || "").toLowerCase();
  if (!kategori || kategori === "semua") return json;
  const data = json.data.filter((c) => (c.kategori_hukum || "umum").toLowerCase() === kategori);
  return { ...json, data, total: data.length };
}

function emulateConsultations(query, json) {
  if (query.aktif !== "true") return json;
  const data = json.data.filter((c) => DASHBOARD_STATUSES.includes(c.status_pengajuan)).sort(byNewest);
  return { ...json, data };
}

function emulateAdminConsultants(query, json) {
  const keyword = (query.search || "").toLowerCase();
  const data = keyword
    ? json.data.filter((c) => includesText(c.nama_lengkap, keyword) || includesText(c.spesialisasi, keyword))
    : json.data;
  const countOf = (status) => json.data.filter((c) => c.status_verifikasi === status).length;
  const counts = json.counts || {
    all: json.data.length,
    pending: countOf("pending"),
    terverifikasi: countOf("terverifikasi"),
    ditolak: countOf("ditolak"),
  };
  return { ...json, data, total: data.length, counts };
}

function emulateConsultantHistory(_query, json) {
  const when = (r) => `${r.tanggal_konsultasi || ""}T${r.jam_mulai || ""}`;
  const data = json.data
    .filter((r) => String(r.status).toLowerCase() !== "pending")
    .sort((a, b) => when(b).localeCompare(when(a)));
  return { ...json, data };
}

const LIST_EMULATORS = {
  "/consultants/me/history": emulateConsultantHistory,
  "/consultants/": emulateCatalog,
  "/cases/": emulateCases,
  "/consultations/": emulateConsultations,
  "/admin/consultants": emulateAdminConsultants,
};

/** Endpoint yang hasilnya diturunkan backend dari data endpoint lain. */
const DERIVED_ENDPOINTS = {
  "/consultations/history": {
    from: "/consultations/",
    build: (json) => {
      const rank = (c) => {
        const index = HISTORY_PRIORITY.indexOf(c.status_pengajuan);
        return index === -1 ? HISTORY_PRIORITY.length : index;
      };
      const data = [...(json.data || [])].sort((a, b) => rank(a) - rank(b) || byNewest(a, b));
      return { total_sesi_selesai: data.filter((c) => c.status_pengajuan === "selesai").length, data };
    },
  },
  "/consultants/me/next-session": {
    from: "/consultants/me/requests/active",
    build: (json) => {
      const upcoming = (Array.isArray(json) ? json : [])
        .filter((r) => String(r.status_pengajuan).toLowerCase() === "terjadwal")
        .filter((r) => r.tanggal_pengajuan && r.jam_mulai && !isPastSession(r))
        .sort(
          (a, b) =>
            new Date(`${String(a.tanggal_pengajuan).split("T")[0]}T${a.jam_mulai}`) -
            new Date(`${String(b.tanggal_pengajuan).split("T")[0]}T${b.jam_mulai}`),
        );
      return { data: upcoming[0] || null };
    },
  },
};

const isSuccess = (res) => !res.abort && (!res.status || res.status < 400) && res.json !== undefined;

export class MockApi {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.handlers = [];
    this.requests = [];
    this.unmatched = [];
  }

  async install() {
    await this.page.route(
      (url) => url.pathname.includes("/api/v1/") && url.port !== this._frontendPort(),
      (route) => this._handle(route),
    );
  }

  _frontendPort() {
    const base = process.env.E2E_REGRESSION_BASE_URL || `http://localhost:${process.env.E2E_REGRESSION_PORT || 3100}`;
    return new URL(base).port;
  }

  /**
   * @param {string} method  GET|POST|PUT|PATCH|DELETE|*
   * @param {string|RegExp} pattern path setelah `/api/v1`, mis. "/auth/profile" atau /^\/consultations\/\d+$/
   * @param {object|Function} response
   */
  on(method, pattern, response) {
    this.handlers.unshift({ method: method.toUpperCase(), pattern, response });
    return this;
  }

  _match(handler, method, path) {
    if (handler.method !== "*" && handler.method !== method) return false;
    if (handler.pattern instanceof RegExp) return handler.pattern.test(path);
    return handler.pattern === path;
  }

  async _handle(route) {
    const request = route.request();
    const method = request.method();

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "") || "/";
    const record = {
      method,
      path,
      query: Object.fromEntries(url.searchParams),
      body: parseBody(request),
      headers: request.headers(),
      at: Date.now(),
    };
    this.requests.push(record);

    let handler = this.handlers.find((h) => this._match(h, method, path));
    const derived = !handler && method === "GET" ? DERIVED_ENDPOINTS[path] : null;
    if (derived) handler = this.handlers.find((h) => this._match(h, method, derived.from));
    if (!handler) {
      this.unmatched.push(`${method} ${path}`);
      return route.fulfill({
        status: 404,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
        body: JSON.stringify({ detail: `E2E mock: endpoint ${method} ${path} tidak di-mock` }),
      });
    }

    let res = typeof handler.response === "function" ? await handler.response(record) : handler.response;
    res = res || {};
    if (method === "GET" && isSuccess(res)) {
      if (derived) res = { ...res, json: derived.build(res.json) };
      else if (LIST_EMULATORS[path] && Array.isArray(res.json?.data)) {
        res = { ...res, json: LIST_EMULATORS[path](record.query, res.json) };
      }
    }
    if (res.delay) await new Promise((r) => setTimeout(r, res.delay));
    if (res.abort) return route.abort(res.abort === true ? "failed" : res.abort);

    const body =
      res.body !== undefined ? res.body : JSON.stringify(res.json !== undefined ? res.json : {});
    return route.fulfill({
      status: res.status || 200,
      headers: { ...CORS_HEADERS, "content-type": "application/json", ...(res.headers || {}) },
      body,
    });
  }

  /** Semua request yang cocok dengan method + pattern. */
  calls(method, pattern) {
    return this.requests.filter(
      (r) =>
        (method === "*" || r.method === method.toUpperCase()) &&
        (pattern instanceof RegExp ? pattern.test(r.path) : r.path === pattern),
    );
  }

  /** Tunggu sampai request tertentu dikirim browser. */
  async waitFor(method, pattern, timeout = 10_000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const found = this.calls(method, pattern);
      if (found.length) return found[found.length - 1];
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Request ${method} ${pattern} tidak terkirim dalam ${timeout}ms. Terkirim: ${this.requests.map((r) => `${r.method} ${r.path}`).join(", ")}`);
  }

  // ─── Handler default per role ──────────────────────────────────────────

  common(role) {
    const user = USERS[role === "consultant" ? "konsultan" : role];
    this.on("GET", "/auth/profile", { json: { data: user } });
    this.on("GET", "/users/me/profile/full", { json: user });
    this.on("GET", "/users/me/settings", { json: {} });
    this.on("POST", "/auth/logout", { json: { data: { ok: true } } });
    this.on("POST", "/auth/refresh", { json: { data: { session: session(user.role) } } });
    this.on("GET", "/chatbot/sessions", { json: { sessions: [] } });
    return this;
  }

  asClient() {
    this.common("client");
    this.on("GET", "/consultations/", { json: { data: [] } });
    this.on("GET", "/consultants/", { json: { data: CATALOG } });
    return this;
  }

  asConsultant() {
    this.common("konsultan");
    this.on("GET", "/consultants/me/dashboard-stats", {
      json: { total_income: 1500000, total_klien: 4, total_klien_aktif: 2, is_active: true },
    });
    this.on("GET", "/consultants/me/requests/pending", { json: [] });
    this.on("GET", "/consultants/me/requests/active", { json: [] });
    this.on("GET", "/consultants/me/schedules", { json: [] });
    this.on("GET", "/consultants/me/history", { json: { total_sesi_selesai: 0, data: [] } });
    this.on("GET", "/cases/", { json: { data: [] } });
    return this;
  }

  asAdmin() {
    this.common("admin");
    this.on("GET", "/admin/stats", { json: ADMIN_STATS });
    this.on("GET", "/admin/consultants", (req) => {
      const all = [
        adminConsultant(),
        adminConsultant({ id_konsultan: 21, nama_lengkap: "Gita Permata", spesialisasi: "Perdata", status_verifikasi: "pending" }),
        adminConsultant({ id_konsultan: 22, nama_lengkap: "Hendra Saputra", spesialisasi: "Umum", status_verifikasi: "terverifikasi" }),
        adminConsultant({ id_konsultan: 23, nama_lengkap: "Indah Sari", spesialisasi: "Pidana", status_verifikasi: "ditolak" }),
      ];
      const f = req.query.status_filter;
      const data = f && f !== "all" ? all.filter((c) => c.status_verifikasi === f) : all;
      return { json: { data, total: data.length } };
    });
    this.on("GET", "/admin/documents/", {
      json: { data: [adminDocument(), adminDocument({ frbr_uri: "/akn/id/act/uu/1946/1", nama_uu: "Kitab Undang-Undang Hukum Pidana", nomor_uu: "1", tahun_uu: "1946", kategori: "pidana", total_chunks: 569 })], total: 2 },
    });
    return this;
  }
}
