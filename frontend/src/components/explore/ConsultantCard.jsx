"use client";

import { MaterialIcon } from "@/components/ui";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider"; // Import Hook Tema

const getSafeAvatarSrc = (url, fallbackUrl) => {
  if (!url) return fallbackUrl;

  try {
    const parsed = new URL(url);
    const safeHosts = new Set([
      "ui-avatars.com",
      "lh3.googleusercontent.com",
      "images.unsplash.com",
      "supabase.co",
      "*.supabase.co",
      "storage.googleapis.com",
      "res.cloudinary.com",
    ]);

    if (parsed.hostname === "i.ibb.co" || parsed.hostname.endsWith(".ibb.co")) {
      return fallbackUrl;
    }

    const isSafeHost =
      safeHosts.has(parsed.hostname) ||
      parsed.hostname.endsWith(".supabase.co");

    return parsed.protocol === "https:" && isSafeHost ? url : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

export default function ConsultantCard({ consultant }) {
  const { name, spec, rating, reviews, status, foto_profil, status_verifikasi, tarif_per_sesi } = consultant;
  const { theme } = useTheme(); // Ambil state tema aktif

  const detailHref = consultant?.id ? `/explore/${consultant.id}` : "/explore";

  // --- SOLUSI 1: Mapping Warna Hex untuk API Eksternal ---
  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };

  // Ambil config berdasarkan tema, fallback ke dark-tech jika tidak ditemukan
  const activeColors = themeColors[theme] || themeColors["dark-tech"];

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Konsultan",
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=128`;
  const avatarSrc = getSafeAvatarSrc(foto_profil, fallbackUrl);

  return (
    <div className="bg-card/60 border border-surface p-5 rounded-3xl flex items-center justify-between group hover:border-primary-light/40 transition-all duration-300 shadow-lg" data-testid="consultant-card">
      <div className="flex items-center gap-5">
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-surface bg-bg">
            <img
              key={`${foto_profil}-${theme}`} // Key ditambahkan agar refresh saat tema ganti
              src={avatarSrc}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.src = fallbackUrl;
              }}
            />
          </div>

          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card transition-colors duration-500 ${
              status === "online"
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-zinc-500"
            }`}
          />
        </div>

        {/* Details */}
        <div className="space-y-1">
          <h3 className="font-headline font-bold text-main lg:text-lg leading-tight flex items-center gap-2">
            {name}
            {status_verifikasi === "terverifikasi" && (
              <MaterialIcon name="verified" className="text-blue-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified" />
            )}
          </h3>
          <p className="text-primary-light text-xs lg:text-sm font-medium">
            {spec}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <MaterialIcon
                name="star"
                className="text-amber-400 text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              />
              <span className="font-bold text-main">{rating}</span>
              <span className="opacity-60">({reviews} Ulasan)</span>
            </div>

            {tarif_per_sesi > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted">
                <MaterialIcon name="payments" className="text-emerald-500 text-base" />
                <span className="font-bold text-main">
                  Rp {tarif_per_sesi.toLocaleString("id-ID")}
                </span>
              </div>
            )}
            {tarif_per_sesi === 0 && (
              <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                Gratis
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        href={detailHref}
        className="btn-outline !px-6 !py-2.5 text-sm !rounded-xl !bg-surface border border-surface text-main hover:!bg-primary hover:!text-white transition-all active:scale-95"
      >
        Lihat
      </Link>
    </div>
  );
}
