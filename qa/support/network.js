import { ENDPOINTS } from "./endpoints.js";
import { API_PREFIX, env } from "./env.js";

const API_PORT = new URL(env.apiUrl).port;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function endpoint(name) {
  const found = ENDPOINTS[name];
  if (!found) throw new Error(`Layanan "${name}" belum terdaftar di support/endpoints.js`);
  return found;
}

const apiPath = (url) => (url.port === API_PORT && url.pathname.startsWith(API_PREFIX) ? url.pathname.slice(API_PREFIX.length) : null);

const matchesPath = (pattern, path) => (pattern instanceof RegExp ? pattern.test(path) : pattern === path);

function readBody(request) {
  try {
    return request.postDataJSON();
  } catch {
    return request.postData();
  }
}

/**
 * Mengamati lalu lintas ke backend sungguhan, dan bila skenario memintanya,
 * mensimulasikan kondisi yang tidak bisa dipicu dari UI (gangguan server, respons lambat).
 */
export class Network {
  constructor(page) {
    this.page = page;
    this.requests = [];
  }

  install() {
    this.page.on("request", (request) => {
      const url = new URL(request.url());
      const path = apiPath(url);
      if (path === null || request.method() === "OPTIONS") return;
      const record = {
        method: request.method(),
        path,
        query: Object.fromEntries(url.searchParams),
        headers: request.headers(),
        body: readBody(request),
        status: null,
      };
      this.requests.push(record);
      request
        .response()
        .then((response) => (record.status = response?.status() ?? null))
        .catch(() => {});
    });
  }

  calls(name) {
    const { method, path } = endpoint(name);
    return this.requests.filter((request) => request.method === method && matchesPath(path, request.path));
  }

  async waitForCall(name, timeout = 15_000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const [first] = this.calls(name);
      if (first) return first;
      await sleep(50);
    }
    throw new Error(`Permintaan ke layanan "${name}" tidak terkirim dalam ${timeout} ms.`);
  }

  /**
   * @param {string} name nama layanan di support/endpoints.js
   * @param {(route: import("@playwright/test").Route, attempt: number) => Promise<void>} respond
   */
  async intercept(name, respond) {
    const { method, path } = endpoint(name);
    let attempt = 0;
    await this.page.route(
      (url) => {
        const requested = apiPath(url);
        return requested !== null && matchesPath(path, requested);
      },
      (route) => (route.request().method() === method ? respond(route, ++attempt) : route.fallback()),
    );
  }

  /** Mengganti jawaban layanan. `times` membatasi berapa kali simulasi berlaku. */
  reply(name, { status = 200, json = {}, times = Infinity, delayMs = 0 } = {}) {
    return this.intercept(name, async (route, attempt) => {
      if (attempt > times) return route.fallback();
      if (delayMs) await sleep(delayMs);
      return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(json) });
    });
  }

  fail(name, { status = 500, detail, times } = {}) {
    return this.reply(name, { status, json: detail === undefined ? {} : { detail }, times });
  }

  disconnect(name) {
    return this.intercept(name, (route) => route.abort());
  }

  /** Permintaan tetap diteruskan ke backend sungguhan setelah ditahan sejenak. */
  slowDown(name, ms = 1500) {
    return this.intercept(name, async (route) => {
      await sleep(ms);
      await route.fallback();
    });
  }
}
