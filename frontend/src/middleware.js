import { NextResponse } from "next/server";

// Daftar path yang butuh login
const PROTECTED_PATHS = [
  "/dashboard",
  "/konsultasi",
  "/schedule",
  "/setting",
  "/bursa",
];

const normalizeRole = (role) => {
  if (role === "konsultan" || role === "consultant") return "konsultan";
  if (role === "client") return "client";
  if (role === "admin") return "admin";
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
  let rawRole = request.cookies.get("ll_role")?.value;
  const refreshToken = request.cookies.get("ll_refresh")?.value;

  let refreshedSession = null;

  // 3. Jika token kosong atau sudah kedaluwarsa, coba refresh sesi
  if (!token || isTokenExpired(token)) {
    if (refreshToken) {
      const session = await refreshSession(refreshToken);
      if (session?.access_token) {
        token = session.access_token;
        refreshedSession = session;

        // AMANKAN ROLE: Ekstrak role langsung dari token baru hasil refresh jika cookie role hilang
        const decoded = decodeJwtPayload(token);
        const jwtRole = decoded?.user_metadata?.role || decoded?.role;
        if (jwtRole) rawRole = jwtRole;
      }
    }
  }

  const role = normalizeRole(rawRole);
  const isTokenValid = Boolean(token) && !isTokenExpired(token);
  const hasSession = isTokenValid || Boolean(refreshedSession);

  // Perbaikan fungsi pemasangan cookie agar ll_role ikut ter-update secara berkala
  const applySessionCookies = (response) => {
    if (!refreshedSession) return response;

    const cookieAge = refreshedSession.expires_in || 60 * 60;

    response.cookies.set(
      "ll_token",
      refreshedSession.access_token,
      getCookieOptions(request, cookieAge),
    );

    // SOLUSI BUG 1: Pastikan ll_role ikut ditulis ulang agar masa aktifnya sinkron
    if (rawRole) {
      response.cookies.set(
        "ll_role",
        rawRole,
        getCookieOptions(request, cookieAge),
      );
    }

    if (refreshedSession.refresh_token) {
      response.cookies.set(
        "ll_refresh",
        refreshedSession.refresh_token,
        getCookieOptions(request, 60 * 60 * 24 * 30), // 30 Hari
      );
    }
    return response;
  };

  // 4. Logika rute auth (/auth/login, /auth/register, dll)
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

    if (role === "admin") {
      return applySessionCookies(
        NextResponse.redirect(new URL("/dashboard/admin", request.url)),
      );
    }

    return applySessionCookies(NextResponse.next());
  }

  // Jika tidak punya sesi aktif, bersihkan sisa sampah cookies dan lempar ke login
  if (!hasSession) {
    return redirectWithClearCookies(request, "/auth/login");
  }

  // SOLUSI BUG 2: Pengalihan otomatis jika menembak rute "/dashboard" secara pas/persis
  if (pathname === "/dashboard") {
    if (role === "admin")
      return applySessionCookies(
        NextResponse.redirect(new URL("/dashboard/admin", request.url)),
      );
    if (role === "konsultan")
      return applySessionCookies(
        NextResponse.redirect(new URL("/dashboard/consultant", request.url)),
      );
    return applySessionCookies(
      NextResponse.redirect(new URL("/dashboard/client", request.url)),
    );
  }

  const isConsultantPath = pathname.startsWith("/dashboard/consultant");
  const isClientPath = pathname.startsWith("/dashboard/client");
  const isAdminPath = pathname.startsWith("/dashboard/admin");

  // 5. Role Guard: Admin routes
  if (isAdminPath && role !== "admin") {
    const fallback =
      role === "konsultan" ? "/dashboard/consultant" : "/dashboard/client";
    return applySessionCookies(
      NextResponse.redirect(new URL(fallback, request.url)),
    );
  }

  // 6. Role Guard: Cegah Client masuk ke dashboard Konsultan
  if (isConsultantPath && role !== "konsultan") {
    const fallback =
      role === "admin" ? "/dashboard/admin" : "/dashboard/client";
    return applySessionCookies(
      NextResponse.redirect(new URL(fallback, request.url)),
    );
  }

  // 7. Role Guard: Cegah Konsultan masuk ke dashboard Client
  if (isClientPath && role !== "client") {
    const fallback =
      role === "admin" ? "/dashboard/admin" : "/dashboard/consultant";
    return applySessionCookies(
      NextResponse.redirect(new URL(fallback, request.url)),
    );
  }

  // 8. Jika di rute terproteksi lain tapi belum pilih role
  if (!role) {
    return applySessionCookies(
      NextResponse.redirect(new URL("/auth/role", request.url)),
    );
  }

  // --- REFACTOR UTAMA: ANTI-BFCACHE UNTUK HALAMAN PROTECTED ---
  const response = applySessionCookies(NextResponse.next());

  if (isProtected) {
    response.headers.set(
      "Cache-Control",
      "no-store, max-age=0, must-revalidate",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/konsultasi/:path*",
    "/schedule/:path*",
    "/setting/:path*",
    "/bursa/:path*",
    "/auth/:path*",
  ],
};
