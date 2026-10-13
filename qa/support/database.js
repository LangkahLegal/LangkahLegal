import { env } from "./env.js";

const headers = (extra = {}) => ({
  apikey: env.supabaseKey,
  Authorization: `Bearer ${env.supabaseKey}`,
  "Content-Type": "application/json",
  ...extra,
});

async function request(method, table, { filters = {}, body, prefer } = {}) {
  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  Object.entries(filters).forEach(([column, condition]) => url.searchParams.set(column, condition));

  const response = await fetch(url, {
    method,
    headers: headers(prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${table} gagal (${response.status}): ${text}`);
  return text ? JSON.parse(text) : [];
}

export const eq = (value) => `eq.${value}`;
export const inList = (values) => `in.(${values.join(",")})`;

export const db = {
  select: (table, filters = {}, columns = "*") => request("GET", table, { filters: { select: columns, ...filters } }),

  async first(table, filters = {}, columns = "*") {
    const rows = await db.select(table, { ...filters, limit: 1 }, columns);
    return rows[0] ?? null;
  },

  async insert(table, row) {
    const rows = await request("POST", table, { body: row, prefer: "return=representation" });
    return rows[0];
  },

  update: (table, filters, values) =>
    request("PATCH", table, { filters, body: values, prefer: "return=representation" }),

  remove(table, filters) {
    if (!Object.keys(filters).length) throw new Error(`Hapus ${table} tanpa filter ditolak.`);
    return request("DELETE", table, { filters });
  },
};
