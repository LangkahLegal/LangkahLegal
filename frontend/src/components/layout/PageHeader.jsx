"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function PageHeader({ title, backHref, onSettingsClick }) {
  const pathname = usePathname();
  const router = useRouter();

  // 1. Logika Deteksi Sub-halaman Pengaturan
  const isSettingSubPage = pathname.startsWith("/setting/");
  const isConsultantPage = pathname.includes("/dashboard/consultant");

  // 2. Tentukan Default Back Href
  let dynamicBack = isConsultantPage
    ? "/dashboard/consultant"
    : "/dashboard/client";

  if (isSettingSubPage) {
    dynamicBack = "/setting";
  }

  // 3. Gunakan prop backHref jika dikirim dari parent, jika tidak gunakan dynamicBack
  const finalBackHref = backHref || dynamicBack;

  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0e0c1e]/80 backdrop-blur-md border-b border-white/5 px-6 py-5 lg:px-12 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href={finalBackHref}
            className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-[#ada3ff]/10 hover:border-[#ada3ff]/30 transition-all duration-300 group/back"
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

        <button
          type="button"
          onClick={handleSettingsClick}
          className="p-2 hover:bg-white/5 rounded-full transition-colors group"
        >
          <MaterialIcon
            name="settings"
            className="text-[#aca8c1] group-hover:text-white group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
          />
        </button>
      </div>
    </header>
  );
}
