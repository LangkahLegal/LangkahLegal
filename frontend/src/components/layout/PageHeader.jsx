"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PageHeader({ title, backHref, onSettingsClick }) {
  const pathname = usePathname();
  const router = useRouter();

  // DEBUGGING: Cek di console browser (F12) path aslinya apa
  // useEffect(() => { console.log("Path saat ini:", pathname) }, [pathname]);

  // DETEKSI LEBIH SAKTI: Cek apakah ada kata "setting" di dalam URL
  const isSettingArea = pathname.toLowerCase().includes("/setting");
  const isConsultantPage = pathname.toLowerCase().includes("/dashboard/consultant");

  let dynamicBack = isConsultantPage
    ? "/dashboard/consultant"
    : "/dashboard/client";

  // Jika ada di sub-page setting, back ke induk setting
  if (isSettingArea && pathname !== "/setting" && pathname !== "/settings") {
    dynamicBack = "/setting";
  }

  const finalBackHref = backHref || dynamicBack;

  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0e0c1e]/80 backdrop-blur-md border-b border-white/5 px-6 py-5 lg:px-12 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href={finalBackHref}
            className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/0 border border-white/0 hover:bg-[#ada3ff]/10 hover:border-[#ada3ff]/30 transition-all duration-300 group/back"
          >
            <MaterialIcon
              name="west"
              className="text-[#aca8c1] group-hover/back:text-[#ada3ff] group-hover/back:-translate-x-1 transition-all text-2xl lg:text-3xl"
            />
          </Link>

          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>

        {/* Render Kondisional: Sembunyikan jika di area setting */}
        {!isSettingArea ? (
          <button
            type="button"
            onClick={handleSettingsClick}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group cursor-pointer"
          >
            <MaterialIcon
              name="settings"
              className="text-[#aca8c1] group-hover:text-white group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
            />
          </button>
        ) : (
          <div className="w-10 h-10" /> 
        )}
      </div>
    </header>
  );
}