"use client";

import { MaterialIcon } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PageHeader({ title, onSettingsClick }) {
  const pathname = usePathname();

  // Logika Senior: Deteksi rute secara dinamis
  // Jika path mengandung 'consultan', arahkan balik ke dashboard konsultan,
  // jika tidak, default ke dashboard client.
  const isConsultanPage = pathname.includes("/dashboard/consultan");
  const backHref = isConsultanPage
    ? "/dashboard/consultan"
    : "/dashboard/client";

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0e0c1e]/80 backdrop-blur-md border-b border-white/5 px-6 py-5 lg:px-12 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          {/* Tombol Kembali Dinamis */}
          <Link
            href={backHref}
            className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-[#ada3ff]/10 hover:border-[#ada3ff]/30 transition-all duration-300 group/back"
          >
            <MaterialIcon
              name="west"
              className="text-[#aca8c1] group-hover/back:text-[#ada3ff] group-hover/back:-translate-x-1 transition-all text-2xl lg:text-3xl"
            />
          </Link>

          <h1 className="text-xl lg:text-2xl font-headline font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>

        <button
          onClick={onSettingsClick}
          className="btn-icon p-2 hover:bg-white/5 rounded-full transition-colors group"
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
