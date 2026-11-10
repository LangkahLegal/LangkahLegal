/** Mengisi sessionStorage sebelum aplikasi dimuat, sekali per tab. */
export async function presetSessionStorage(page, entries) {
  await page.addInitScript((items) => {
    for (const [key, value] of Object.entries(items)) {
      const marker = `__sit_preset_${key}`;
      if (sessionStorage.getItem(marker)) continue;
      sessionStorage.setItem(key, value);
      sessionStorage.setItem(marker, "1");
    }
  }, entries);
}

export const readSessionStorage = (page, key) => page.evaluate((name) => sessionStorage.getItem(name), key);

export const readLocalStorage = (page, key) => page.evaluate((name) => localStorage.getItem(name), key);

export const SESSION_COOKIES = ["ll_token", "ll_refresh"];

/** Nilai cookie sesi httpOnly di browser; null bila tidak ada. */
export async function readSessionCookie(page, name) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === name) ?? null;
}

const loginMethodOf = (accessToken) => {
  try {
    const claims = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    return (claims.amr || []).some((entry) => entry?.method === "password") ? "password" : "other";
  } catch {
    return null;
  }
};

/** Cookie sesi httpOnly seperti yang disetel backend lewat Set-Cookie. */
export async function setSessionCookies(page, baseUrl, session) {
  const url = new URL(baseUrl).origin;
  await page.context().addCookies(
    [
      ["ll_token", session.access_token],
      ["ll_refresh", session.refresh_token],
    ]
      .filter(([, value]) => value)
      .map(([name, value]) => ({ name, value, url, httpOnly: true, sameSite: "Lax" })),
  );
}

/** Menanam sesi seperti hasil login: cookie httpOnly berisi token, penanda sesi dan peran di localStorage. */
export async function seedSessionCookies(page, baseUrl, session, role) {
  await setSessionCookies(page, baseUrl, session);
  await page.addInitScript(
    ({ role, loginMethod }) => {
      if (window.sessionStorage.getItem("__sit_seeded")) return;
      localStorage.setItem("ll_session", "1");
      if (loginMethod) localStorage.setItem("ll_login_method", loginMethod);
      if (role) ["ll_role", "role"].forEach((key) => localStorage.setItem(key, role));
      window.sessionStorage.setItem("__sit_seeded", "1");
    },
    { role, loginMethod: loginMethodOf(session.access_token ?? "") },
  );
}

