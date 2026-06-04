import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
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
    "/auth/:path*",
  ],
};
