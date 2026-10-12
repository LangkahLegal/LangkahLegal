/**
 * Warm-up server Next.js sebelum test berjalan paralel, agar request pertama
 * (render halaman + optimasi gambar besar di /public/images) tidak memicu timeout.
 */
module.exports = async function globalSetup(config) {
  const project = config.projects.find((p) => p.name === "desktop-chromium") || config.projects[0];
  const baseURL = project?.use?.baseURL;
  if (!baseURL || !/localhost|127\.0\.0\.1/.test(baseURL) || process.env.E2E_SKIP_WARMUP) return;

  const pages = [
    "/", "/about", "/privacy", "/terms", "/compliance", "/auth/login", "/auth/role", "/auth/signup",
    "/auth/verify", "/auth/forgot-password", "/auth/reset-password", "/auth/create-password",
    "/auth/callback", "/dashboard/client", "/dashboard/consultant", "/dashboard/admin", "/explore",
    "/explore/10", "/payment/501", "/history/client", "/history/consultant", "/consultation",
    "/consultation/501", "/request/601", "/schedule", "/bursa", "/bursa/post", "/ai", "/setting",
    "/setting/profile", "/setting/security", "/setting/language", "/setting/about", "/verification",
    "/verification/20", "/knowledge", "/knowledge/detail",
  ];
  const images = ["background.jpg", "bg_editorial.jpg", "statue.png", "icons.png", "logo.png", "visi.png", "consultation.jpg"];
  const widths = [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

  const hit = (path) => fetch(new URL(path, baseURL)).then((r) => r.arrayBuffer()).catch(() => null);
  await Promise.all(pages.map(hit));
  for (const img of images) {
    await Promise.all(widths.map((w) => hit(`/_next/image?url=${encodeURIComponent(`/images/${img}`)}&w=${w}&q=75`)));
  }
};
