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
  return response;
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Cek apakah path saat ini masuk dalam daftar proteksi
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  // 2. Ambil token & role dari cookies
  const token = request.cookies.get("ll_token")?.value;
  const rawRole = request.cookies.get("ll_role")?.value;
  const role = normalizeRole(rawRole);

  // 3. Jika token kosong atau sudah kedaluwarsa, tendang ke login
  if (!token || isTokenExpired(token)) {
    return redirectWithClearCookies(request, "/auth/login");
  }

  const isConsultantPath = pathname.startsWith("/dashboard/consultant");
  const isClientPath = pathname.startsWith("/dashboard/client");

  // 4. Role Guard: Cegah Client masuk ke dashboard Konsultan
  if (isConsultantPath && role !== "konsultan") {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  // 5. Role Guard: Cegah Konsultan masuk ke dashboard Client
  if (isClientPath && role === "konsultan") {
    return NextResponse.redirect(new URL("/dashboard/consultant", request.url));
  }

  // 6. Jika di /dashboard tapi belum pilih role (kasus langka)
  if (pathname.startsWith("/dashboard") && !role) {
    return NextResponse.redirect(new URL("/auth/role", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher yang lebih clean
  matcher: [
    "/dashboard/:path*",
    "/konsultasi/:path*",
    "/schedule/:path*",
    "/setting/:path*",
  ],
};
