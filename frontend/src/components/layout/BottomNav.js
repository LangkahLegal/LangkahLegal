"use client";

import { MaterialIcon } from "@/components/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";

const CLIENT_NAV = [
  { label: "Konsultasi", icon: "gavel", path: "/explore" },
  { label: "Bursa", icon: "storefront", path: "/bursa/post" },
  { label: "Tanya AI", icon: "psychology", path: "/ai" },
  { label: "Riwayat", icon: "history", path: "/history/client" },
];

const CONSULTANT_NAV = [
  { label: "Klien", icon: "group", path: "/consultation" },
  { label: "Bursa", icon: "storefront", path: "/bursa" },
  { label: "Riwayat", icon: "history", path: "/history/consultant" },
  { label: "Jadwal", icon: "calendar_today", path: "/schedule" },
];

const ADMIN_NAV = [
  { label: "Verifikasi", icon: "verified_user", path: "/verification" },
  { label: "Knowledge", icon: "menu_book", path: "/knowledge" },
];

export default function BottomNav({ role = "client", className = "" }) {
  const pathname = usePathname();
  const navItems =
    role === "admin"
      ? ADMIN_NAV
      : role === "konsultan"
        ? CONSULTANT_NAV
        : CLIENT_NAV;

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 bg-dark/90 border-t border-muted/30 z-50 backdrop-blur-xl lg:hidden ${className}`}
    >
      {/* Mengubah py-4 menjadi py-2.5 agar height navbar lebih ramping */}
      <div className="max-w-md mx-auto flex items-center justify-around w-full px-4 py-2.5">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={idx}
              href={item.path}
              // Mengubah gap-1.5 menjadi gap-1 agar jarak ikon dan teks lebih dekat
              className={`flex flex-col items-center gap-1 transition-all duration-300 group w-16 ${
                isActive ? "text-main" : "text-muted hover:text-main"
              }`}
            >
              <div className="relative">
                <MaterialIcon
                  name={item.icon}
                  className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-primary-light" : ""
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                />

                {/* Indikator Titik Aktif */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary-light rounded-full shadow-[0_0_8px_var(--color-primary-light)]" />
                )}
              </div>

              <span
                className={`text-[10px] uppercase tracking-widest transition-all ${
                  isActive
                    ? "font-bold opacity-100"
                    : "font-medium opacity-70 group-hover:opacity-100"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
