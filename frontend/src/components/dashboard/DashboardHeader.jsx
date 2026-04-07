"use client";

import { MaterialIcon } from "@/components/ui";
import { useRouter } from "next/navigation";

/**
 * DashboardHeader Component
 * @param {string} userName - Nama pengguna yang akan disapa
 * @param {string} foto_profil - URL foto profil dari database
 */
export default function DashboardHeader({
  userName = "Pengguna",
  foto_profil, // Ganti dari avatarUrl
  onSettingsClick,
}) {
  const router = useRouter();
  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  // Fallback UI-Avatars jika foto_profil kosong
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName || "User",
  )}&background=1f1d35&color=ada3ff&size=128`;

  return (
    <section className="sticky top-0 z-50 flex justify-between items-center w-full transition-all duration-300 px-6 py-4 lg:px-10 lg:py-6 border-b border-white/5 bg-[#0e0c1e]/40 backdrop-blur-md shadow-[0_15px_40px_-20px_rgba(255,255,255,0.1)]">
      {/* Group Kiri: Avatar & Identitas */}
      <div className="flex items-center gap-4">
        {/* User Avatar Container */}
        <div className="relative group/avatar">
          <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shadow-lg transition-all group-hover/avatar:border-[#ada3ff]/50">
            <img
              // SENIOR TIP: Gunakan URL sebagai key agar React refresh saat foto diganti
              key={foto_profil}
              src={foto_profil || fallbackUrl}
              alt={userName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              onError={(e) => {
                e.target.src = fallbackUrl;
              }}
            />
          </div>
          {/* Status Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-emerald-500 border-2 border-[#0e0c1e] rounded-full" />
        </div>

        {/* Sapaan Teks */}
        <div className="flex flex-col -space-y-1">
          <span className="text-[#aca8c1] text-xs lg:text-sm font-medium opacity-80">
            Halo,
          </span>
          <h2 className="text-lg lg:text-2xl font-headline font-bold text-white tracking-tight">
            {userName}
          </h2>
        </div>
      </div>

      {/* Group Kanan: Actions */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Settings"
          type="button"
          onClick={handleSettingsClick}
          className=" hover:bg-white/10 p-2 lg:p-3 rounded-full transition-all group active:scale-95 "
        >
          <MaterialIcon
            name="settings"
            className="text-[#aca8c1] group-hover:text-white group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
          />
        </button>
      </div>
    </section>
  );
}
