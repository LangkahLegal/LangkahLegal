import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/konsultasi",
  "/schedule",
  "/setting",
];

const isProtectedPath = (pathname) =>
  PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ll_token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const role = request.cookies.get("ll_role")?.value;

  if (
    pathname.startsWith("/dashboard/consultan") &&
    role &&
    role !== "konsultan"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/client";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard/client") && role === "konsultan") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/consultan";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard") && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/role";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/konsultasi/:path*",
    "/schedule/:path*",
    "/setting/:path*",
  ],
};
