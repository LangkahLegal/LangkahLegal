/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  serverExternalPackages: ['lightningcss', '@tailwindcss/oxide'],
};

export default nextConfig;