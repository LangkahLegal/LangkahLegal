"use client";

import { MaterialIcon } from "@/components/ui";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider"; // Import Hook Tema

const getSafeAvatarSrc = (url, fallbackUrl) => {
  if (!url) return fallbackUrl;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : fallbackUrl;
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
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=256`;
  const avatarSrc = getSafeAvatarSrc(foto_profil, fallbackUrl);

  return (
    <div
      className="bg-card/60 border border-surface rounded-2xl lg:rounded-3xl overflow-hidden flex flex-col h-full group hover:border-primary-light/40 transition-all duration-300 shadow-lg"
      data-testid="consultant-card"
    >
      {/* Foto persegi seperti kartu produk marketplace */}
      <div className="relative aspect-square lg:aspect-4/3 bg-bg overflow-hidden">
        <img
          key={`${foto_profil}-${theme}`} // Key ditambahkan agar refresh saat tema ganti
          src={avatarSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = fallbackUrl;
          }}
        />

        <span
          className={`absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full border-2 border-card transition-colors duration-500 ${
            status === "online"
              ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
              : "bg-zinc-500"
          }`}
        />

        {spec && (
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm text-primary-light text-nav lg:text-xs font-bold">
            {spec}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 gap-1.5 p-3 lg:p-4">
        <h3 className="font-headline font-bold text-main text-sm lg:text-base leading-snug line-clamp-2">
          {name}
          {status_verifikasi === "terverifikasi" && (
            <MaterialIcon
              name="verified"
              className="text-blue-500 text-sm lg:text-base align-[-2px] ml-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
              title="Verified"
            />
          )}
        </h3>

        <div className="flex items-center gap-1 text-label lg:text-xs text-muted">
          <MaterialIcon
            name="star"
            className="text-amber-400 text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          />
          <span className="font-bold text-main">{rating}</span>
          <span className="opacity-60 truncate">({reviews} Ulasan)</span>
        </div>

        {tarif_per_sesi > 0 && (
          <p className="text-sm lg:text-base font-black text-main">
            Rp {tarif_per_sesi.toLocaleString("id-ID")}
            <span className="text-nav lg:text-xs font-medium text-muted"> /sesi</span>
          </p>
        )}
        {tarif_per_sesi === 0 && (
          <p className="text-sm lg:text-base font-black text-emerald-500">Gratis</p>
        )}

        <Link
          href={detailHref}
          className="mt-auto pt-2 block"
        >
          <span className="block w-full text-center py-2 text-xs lg:text-sm font-bold rounded-xl bg-surface border border-surface text-main group-hover:border-primary/40 hover:bg-primary! hover:text-white! transition-all active:scale-95">
            Lihat
          </span>
        </Link>
      </div>
    </div>
  );
}
