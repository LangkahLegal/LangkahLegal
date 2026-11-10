const LOCAL_API = "http://localhost:8000/api/v1";
const PRODUCTION_API = "https://langkahlegal-production.up.railway.app/api/v1";

// Sama dengan src/lib/backendUrl.js; diulang di sini karena next.config dimuat Node tanpa alias "@/".
const backendApiUrl = () => {
  try {
    const parsed = new URL(process.env.NEXT_PUBLIC_API_URL || "");
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isLocalhost && parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return process.env.VERCEL ? PRODUCTION_API : LOCAL_API;
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Sama dengan batas proxy rewrite Vercel; jawaban asisten AI bisa lebih dari 30 detik (bawaan Next.js).
  experimental: { proxyTimeout: 120_000 },
  serverExternalPackages: ["lightningcss", "@tailwindcss/oxide"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "x-vercel-enable-rewrite-caching", value: "0" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${backendApiUrl()}/:path*` }];
  },
  async redirects() {
    return [
      {
        source: "/role",
        destination: "/auth/role",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;