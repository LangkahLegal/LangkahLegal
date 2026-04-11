/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  // transpilePackages membantu jika ada masalah import library
  transpilePackages: ['lightningcss'],
  serverExternalPackages: ['lightningcss'],
  experimental: {
    // Biarkan kosong dulu
    turbo: {},
  },
};

export default nextConfig;