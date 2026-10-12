import { env } from "./env.js";

async function request(method, path, body) {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/admin${path}`, {
    method,
    headers: {
      apikey: env.supabaseKey,
      Authorization: `Bearer ${env.supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Auth admin ${method} ${path} gagal (${response.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

export const authAdmin = {
  async listAll() {
    const all = [];
    for (let page = 1; ; page++) {
      const { users = [] } = await request("GET", `/users?page=${page}&per_page=200`);
      all.push(...users);
      if (users.length < 200) return all;
    }
  },

  async findByEmail(email) {
    return (await authAdmin.listAll()).find((user) => user.email === email) ?? null;
  },

  async listByEmailPrefix(prefix) {
    return (await authAdmin.listAll()).filter((user) => user.email?.startsWith(prefix));
  },

  createUser: ({ email, password, name }) =>
    request("POST", "/users", { email, password, email_confirm: true, user_metadata: { full_name: name } }),

  setPassword: (id, password) => request("PUT", `/users/${id}`, { password }),

  deleteUser: (id) => request("DELETE", `/users/${id}`),

  /** Membuat kode OTP tanpa mengirim email. `type`: "signup" atau "recovery". */
  async generateOtp({ type, email, password, name }) {
    const data = await request("POST", "/generate_link", {
      type,
      email,
      password,
      data: name ? { full_name: name } : undefined,
    });
    return { otp: data.email_otp, userId: data.id };
  },
};
