/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["lightningcss", "@tailwindcss/oxide"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
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