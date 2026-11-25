import { NextResponse } from "next/server";

const ROLE_ROUTES = [
  ["/dashboard/admin", "admin"],
  ["/dashboard/consultant", "konsultan"],
  ["/dashboard/client", "client"],
  ["/verification", "admin"],
  ["/knowledge", "admin"],
  ["/schedule", "konsultan"],
  ["/request", "konsultan"],
  ["/history/consultant", "konsultan"],
  ["/history/client", "client"],
  ["/payment", "client"],
];

const matches = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export async function middleware(request) {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  try {
    const response = await fetch(new URL("/api/v1/auth/profile", request.url), {
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.redirect(loginUrl);

    const profile = (await response.json())?.data;
    if (!profile?.role) return NextResponse.redirect(loginUrl);

    const requiredRole = ROLE_ROUTES.find(([path]) => matches(request.nextUrl.pathname, path))?.[1];
    if (requiredRole && profile.role !== requiredRole) {
      return NextResponse.redirect(new URL(`/dashboard/${profile.role === "konsultan" ? "consultant" : profile.role}`, request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/consultation/:path*",
    "/history/:path*",
    "/schedule/:path*",
    "/setting/:path*",
    "/bursa/:path*",
    "/request/:path*",
    "/payment/:path*",
    "/verification/:path*",
    "/knowledge/:path*",
  ],
};
