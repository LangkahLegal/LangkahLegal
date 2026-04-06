import { NextResponse } from "next/server";

// Daftar path yang butuh login
const PROTECTED_PATHS = ["/dashboard", "/konsultasi", "/schedule", "/setting"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Cek apakah path saat ini masuk dalam daftar proteksi
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  // 2. Ambil token & role dari cookies
  const token = request.cookies.get("ll_token")?.value;
  const role = request.cookies.get("ll_role")?.value;

  // 3. Jika tidak ada token, tendang ke login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 4. Role Guard: Cegah Client masuk ke dashboard Konsultan
  if (pathname.startsWith("/dashboard/consultan") && role !== "konsultan") {
    return NextResponse.redirect(new URL("/dashboard/client", request.url));
  }

  // 5. Role Guard: Cegah Konsultan masuk ke dashboard Client
  if (pathname.startsWith("/dashboard/client") && role === "konsultan") {
    return NextResponse.redirect(new URL("/dashboard/consultan", request.url));
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
