"use client";

import { MaterialIcon } from "@/components/ui"; // BrandLogo dihapus
import Link from "next/link";
import Image from "next/image"; // Ditambahkan untuk merender logo
import { usePathname } from "next/navigation";

export default function Sidebar({ role = "client" }) {
  const pathname = usePathname();

  const NAV_ITEMS =
    role === "konsultan"
      ? [
          { label: "Klien", icon: "group", path: "/consultation" },
          { label: "Bursa", icon: "storefront", path: "/bursa" },
          { label: "Riwayat", icon: "history", path: "/history/consultant" },
          { label: "Jadwal", icon: "calendar_today", path: "/schedule" },
        ]
      : role === "admin"
        ? [
            {
              label: "Verifikasi",
              icon: "verified_user",
              path: "/verification",
            },
            { label: "Knowledge", icon: "menu_book", path: "/knowledge" },
          ]
        : [
            { label: "Konsultasi", icon: "gavel", path: "/explore" },
            { label: "Bursa", icon: "storefront", path: "/bursa/post" },
            { label: "Tanya AI", icon: "psychology", path: "/ai" },
            { label: "Riwayat", icon: "history", path: "/history/client" },
          ];

  return (
    /* REFACTOR: bg-dark -> bg-bg | border-white/5 -> border-surface */
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg border-r border-surface p-6 z-50 hidden lg:flex flex-col transition-colors duration-500">
      {/* REFACTOR: Logo Area menggunakan Image dan Link */}
      <Link
        href="/"
        className="flex items-center gap-3 mb-12 px-2 group cursor-pointer"
      >
        <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
          <Image
            src="/images/icons.png"
            alt="LangkahLegal Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        {/* Teks Logo - Hapus span ini jika icons.png sudah berisi teks "LangkahLegal" */}
        <span className="text-xl font-headline font-bold text-main tracking-tight">
          LangkahLegal
        </span>
      </Link>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              /* REFACTOR: hover:bg-white/5 -> hover:bg-surface | text-muted -> text-muted */
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-primary/10 text-primary-light border border-primary/20 shadow-lg shadow-primary/10"
                  : "text-muted hover:bg-surface hover:text-main"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                className={`text-2xl transition-colors ${
                  isActive
                    ? "text-primary-light"
                    : "opacity-70 group-hover:opacity-100"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              />
              <span
                /* REFACTOR: text-white -> text-main (agar otomatis jadi gelap di light mode) */
                className={`font-semibold transition-colors ${
                  isActive ? "text-main" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
