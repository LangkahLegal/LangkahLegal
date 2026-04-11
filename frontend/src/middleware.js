import { NextResponse } from "next/server";

// Daftar path yang butuh login
const PROTECTED_PATHS = ["/dashboard", "/konsultasi", "/schedule", "/setting"];

const normalizeRole = (role) => {
  if (role === "konsultan" || role === "consultant") return "konsultan";
  if (role === "client") return "client";
  return null;
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

const redirectWithClearCookies = (request, pathname) => {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.set("ll_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("ll_role", "", { maxAge: 0, path: "/" });
  response.cookies.set("ll_refresh", "", { maxAge: 0, path: "/" });
  return response;
};

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const getCookieOptions = (request, maxAgeSeconds) => ({
  maxAge: maxAgeSeconds,
  path: "/",
  sameSite: "lax",
  secure: request.nextUrl?.protocol === "https:",
});

const refreshSession = async (refreshToken) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.data?.session || null;
  } catch {
    return null;
  }
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isAuthPath = pathname.startsWith("/auth");
  const isAuthRolePath = pathname.startsWith("/auth/role");

  // 1. Cek apakah path saat ini masuk dalam daftar proteksi
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected && !isAuthPath) return NextResponse.next();

  // 2. Ambil token & role dari cookies
  let token = request.cookies.get("ll_token")?.value;
  const rawRole = request.cookies.get("ll_role")?.value;
  const refreshToken = request.cookies.get("ll_refresh")?.value;
  const role = normalizeRole(rawRole);
  let refreshedSession = null;

  // 3. Jika token kosong atau sudah kedaluwarsa, coba refresh
  if (!token || isTokenExpired(token)) {
    if (refreshToken) {
      const session = await refreshSession(refreshToken);
      if (session?.access_token) {
        token = session.access_token;
        refreshedSession = session;
      }
    }
  }

  const isTokenValid = Boolean(token) && !isTokenExpired(token);
  const hasSession = isTokenValid || Boolean(refreshedSession);

  const applySessionCookies = (response) => {
    if (!refreshedSession) return response;
    response.cookies.set(
      "ll_token",
      refreshedSession.access_token,
      getCookieOptions(request, refreshedSession.expires_in || 60 * 60),
    );
    if (refreshedSession.refresh_token) {
      response.cookies.set(
        "ll_refresh",
        refreshedSession.refresh_token,
        getCookieOptions(request, 60 * 60 * 24 * 30),
      );
    }
    return response;
  };

  if (isAuthPath) {
    if (!hasSession) return NextResponse.next();

    if (!role && !isAuthRolePath) {
      return applySessionCookies(
        NextResponse.redirect(new URL("/auth/role", request.url)),
      );
    }

    if (role === "konsultan") {
      return applySessionCookies(
        NextResponse.redirect(new URL("/dashboard/consultant", request.url)),
      );
    }

    if (role === "client") {
      return applySessionCookies(
        NextResponse.redirect(new URL("/dashboard/client", request.url)),
      );
    }

    return applySessionCookies(NextResponse.next());
  }

  if (!hasSession) {
    return redirectWithClearCookies(request, "/auth/login");
  }

  const isConsultantPath = pathname.startsWith("/dashboard/consultant");
  const isClientPath = pathname.startsWith("/dashboard/client");

  // 4. Role Guard: Cegah Client masuk ke dashboard Konsultan
  if (isConsultantPath && role !== "konsultan") {
    return applySessionCookies(
      NextResponse.redirect(new URL("/dashboard/client", request.url)),
    );
  }

  // 5. Role Guard: Cegah Konsultan masuk ke dashboard Client
  if (isClientPath && role === "konsultan") {
    return applySessionCookies(
      NextResponse.redirect(new URL("/dashboard/consultant", request.url)),
    );
  }

  // 6. Jika di /dashboard tapi belum pilih role (kasus langka)
  if (pathname.startsWith("/dashboard") && !role) {
    return applySessionCookies(
      NextResponse.redirect(new URL("/auth/role", request.url)),
    );
  }

  return applySessionCookies(NextResponse.next());
}

export const config = {
  // Matcher yang lebih clean
  matcher: [
    "/dashboard/:path*",
    "/konsultasi/:path*",
    "/schedule/:path*",
    "/setting/:path*",
    "/auth/:path*",
  ],
};
