"use client";

import { MaterialIcon } from "@/components/ui/Icons";

export default function ClientCard({ name, createdAt, avatar }) {
  // --- INTERNAL HELPER: Menghitung Waktu Relatif (Tetap Sama) ---
  const getRelativeTime = (dateString) => {
    if (!dateString) return "-";
    const now = new Date();
    const isoString =
      dateString.includes("Z") || dateString.includes("+")
        ? dateString
        : `${dateString.replace(" ", "T")}Z`;
    const past = new Date(isoString);
    if (isNaN(past.getTime())) return "-";
    const diffInMs = now.getTime() - past.getTime();
    const diffInSeconds = Math.floor(Math.abs(diffInMs) / 1000);

    if (diffInSeconds < 30) return "Baru saja";
    if (diffInSeconds < 60) return "Kurang dari semenit";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

    return past.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="bg-card p-6 rounded-[2rem] border border-surface flex items-center gap-5 transition-all duration-500 hover:border-primary/30 group">
      {/* Profile Section */}
      <div className="w-20 h-20 shrink-0 rounded-2xl bg-bg flex items-center justify-center border border-surface shadow-inner overflow-hidden transition-colors duration-500">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <MaterialIcon name="person" className="text-3xl text-primary" />
        )}
      </div>

      {/* Info Section */}
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-main leading-tight truncate transition-colors duration-500">
          {name || "Klien Anonim"}
        </h2>
        <div className="flex items-center gap-1.5 text-muted mt-1.5 transition-colors duration-500">
          <MaterialIcon name="schedule" className="text-sm opacity-80" />
          <span className="text-xs font-medium tracking-wide">
            {getRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </section>
  );
}
