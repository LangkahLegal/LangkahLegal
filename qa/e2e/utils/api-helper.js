/**
 * API helpers for E2E test setup & teardown.
 * Calls the FastAPI backend directly to create sessions, set roles, etc.
 */

const API_URL =
  process.env.PLAYWRIGHT_API_URL || "http://localhost:8000/api/v1";

/**
 * Login via API and return session tokens.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token: string, refresh_token: string, user: object}>}
 */
export async function loginViaAPI(email, password) {
  if (!email || !password) {
    throw new Error(
      "E2E login failed: email or password is empty. " +
        "Check your .env.e2e file has E2E_CLIENT_EMAIL, E2E_CONSULTANT_EMAIL, E2E_ADMIN_EMAIL set.",
    );
  }

  let res;
  try {
    res = await fetch(`${API_URL}/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new Error(
      `E2E API login failed: could not reach ${API_URL}/auth/login-password. ` +
        `Is your backend running? (${err.message})`,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `E2E API login failed (${res.status}) for ${email}: ${body.detail || res.statusText}`,
    );
  }

  const json = await res.json();
  const session = json.data?.session || json.data;

  if (!session?.access_token) {
    throw new Error(
      `E2E API login: no access_token in response for ${email}. Response: ${JSON.stringify(json).slice(0, 200)}`,
    );
  }

  return session;
}

/**
 * Get user profile from API.
 * @param {string} accessToken
 * @returns {Promise<object>}
 */
export async function getProfile(accessToken) {
  const res = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to get profile: ${res.status}`);
  const json = await res.json();
  return json.data;
}

/**
 * Create a Bursa case via API.
 * @param {string} accessToken
 * @param {object} payload
 * @param {File[]} files
 * @returns {Promise<object>}
 */
export async function createBursaCase(accessToken, payload, files = []) {
  if (!accessToken) {
    throw new Error("E2E API createBursaCase failed: access token is missing.");
  }

  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  files?.forEach((file) => {
    formData.append("dokumen_pendukung_files", file);
  });

  const res = await fetch(`${API_URL}/cases/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `E2E API createBursaCase failed (${res.status}): ${body.detail || res.statusText}`,
    );
  }

  const json = await res.json();
  return json.data || json;
}

/**
 * Set user role via API.
 * @param {string} accessToken
 * @param {string} role - 'client' | 'konsultan'
 */
export async function setUserRole(accessToken, role) {
  const res = await fetch(`${API_URL}/auth/role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) throw new Error(`Failed to set role: ${res.status}`);
  return res.json();
}

/**
 * Inject authenticated session into a Playwright browser context.
 * Sets localStorage tokens and cookies so the app recognizes the user.
 * @param {import('@playwright/test').Page} page
 * @param {object} session - {access_token, refresh_token}
 * @param {string} role - user role for ll_role cookie
 */
export async function injectSession(page, session, role) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  // Navigate to a blank page on the same origin first
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  // Inject tokens into localStorage
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    },
    { accessToken: session.access_token, refreshToken: session.refresh_token },
  );

  // Set cookies
  const domain = new URL(baseURL).hostname;
  await page.context().addCookies([
    {
      name: "ll_token",
      value: session.access_token,
      domain,
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "ll_refresh",
      value: session.refresh_token,
      domain,
      path: "/",
      sameSite: "Lax",
    },
    {
      name: "ll_role",
      value: role,
      domain,
      path: "/",
      sameSite: "Lax",
    },
  ]);
}
