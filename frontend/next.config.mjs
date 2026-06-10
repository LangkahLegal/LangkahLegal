/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["lightningcss", "@tailwindcss/oxide"],
  hostname: "lh3.googleusercontent.com",
  protocol: "https",
};

export default nextConfig;