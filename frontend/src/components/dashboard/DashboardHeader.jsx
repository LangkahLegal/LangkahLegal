"use client";

import React, { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function DashboardHeader({
  userName = "Pengguna",
  foto_profil,
  onSettingsClick,
}) {
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState("dark-tech");

  // --- 1. THEME DETECTION FOR FALLBACK URL ---
  useEffect(() => {
    const detectTheme = () => {
      // Pastikan berjalan di client-side
      if (typeof window !== "undefined") {
        const htmlClasses = document.documentElement.classList;
        if (htmlClasses.contains("theme-white-modern"))
          return "theme-white-modern";
        if (htmlClasses.contains("theme-cyber-slate"))
          return "theme-cyber-slate"; // Antisipasi jika ada tema lain
        return "dark-tech";
      }
      return "dark-tech";
    };
    setCurrentTheme(detectTheme());
  }, []);

  // Mapping warna hex untuk API ui-avatars
  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
    "theme-cyber-slate": { bg: "17203a", color: "29d1ff" },
  };

  const activeColors = themeColors[currentTheme] || themeColors["dark-tech"];

  // --- 2. LOGIC HANDLERS ---
  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  // Fallback URL dinamis mengikuti tema
  const safeName = userName || "User";
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=128&bold=true`;

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full transition-all duration-300 px-6 py-4 lg:px-10 lg:py-6 border-b border-surface bg-bg/80 backdrop-blur-md shadow-soft">
      {/* Group Kiri: Avatar & Identitas */}
      <div className="flex items-center gap-4">
        {/* User Avatar Container */}
        <div className="relative group/avatar">
          {/* REFACTOR: border-surface & transition border */}
          <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-input border-2 border-surface shadow-soft transition-all group-hover/avatar:border-primary/50">
            <img
              key={foto_profil || currentTheme} // Re-render img jika tema berubah agar fallback update
              src={foto_profil || fallbackUrl}
              alt={safeName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              onError={(e) => {
                e.currentTarget.src = fallbackUrl;
              }}
            />
          </div>
          {/* Status Indicator: Menggunakan border-bg agar menyatu transparan */}
          <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-emerald-500 border-2 border-bg rounded-full shadow-sm" />
        </div>

        {/* Sapaan Teks */}
        <div className="flex flex-col -space-y-1">
          <span className="text-muted text-xs lg:text-sm font-medium opacity-80 uppercase tracking-wider">
            Halo,
          </span>
          <h2 className="text-lg lg:text-2xl font-headline font-black text-main tracking-tight transition-colors duration-500">
            {safeName}
          </h2>
        </div>
      </div>

      {/* Group Kanan: Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          onClick={handleSettingsClick}
          className="group hover:bg-primary/10 transition-all"
          aria-label="Settings"
        >
          <MaterialIcon
            name="settings"
            className="text-muted group-hover:text-primary group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
          />
        </Button>
      </div>
    </header>
  );
}
