"use client";

import { MaterialIcon } from "@/components/ui/Icons";

export default function ClientCard({ name, createdAt, avatar }) {
  // --- INTERNAL HELPER: Menghitung Waktu Relatif ---
  const getRelativeTime = (dateString) => {
    if (!dateString) return "-";

    const now = new Date();

    // 1. Paksa interpretasi sebagai UTC dengan menambahkan 'Z' jika belum ada
    // 2. Hilangkan spasi jika ada (beberapa DB mengirim format "YYYY-MM-DD HH:mm:ss")
    const isoString =
      dateString.includes("Z") || dateString.includes("+")
        ? dateString
        : `${dateString.replace(" ", "T")}Z`;

    const past = new Date(isoString);

    // Jika parsing gagal sama sekali
    if (isNaN(past.getTime())) return "-";

    // Hitung selisih dalam milidetik
    const diffInMs = now.getTime() - past.getTime();

    // Gunakan Math.abs untuk menghindari bug jika jam client sedikit di belakang server
    const diffInSeconds = Math.floor(Math.abs(diffInMs) / 1000);

    // --- LOGIKA THRESHOLD ---

    if (diffInSeconds < 30) {
      return "Baru saja";
    }

    if (diffInSeconds < 60) {
      return "Kurang dari semenit";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`;
    }

    // Jika lebih dari seminggu, tampilkan tanggal aslinya
    return past.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="bg-[#1f1d35] p-6 rounded-[32px] border border-white/5 flex items-center gap-5 transition-all hover:border-[#6f59fe]/30 group">
      {/* Profile Section */}
      <div className="w-20 h-20 shrink-0 rounded-2xl bg-[#0e0c1e] flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <MaterialIcon name="person" className="text-3xl text-[#6f59fe]" />
        )}
      </div>

      {/* Info Section */}
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-white leading-tight truncate">
          {name || "Klien Anonim"}
        </h2>
        <div className="flex items-center gap-1.5 text-[#aca8c1] mt-1.5">
          <MaterialIcon name="schedule" className="text-sm text-[#8f8ca1]" />
          <span className="text-xs font-medium tracking-wide">
            {getRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </section>
  );
}
