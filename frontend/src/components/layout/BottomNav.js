"use client";

import { MaterialIcon } from "@/components/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";

const CLIENT_NAV = [
  { label: "Konsultasi", icon: "gavel", path: "/konsultasi" },
  { label: "Tanya AI", icon: "psychology", path: "/ai" },
  { label: "Riwayat", icon: "history", path: "/history/client" },
  { label: "Berkas", icon: "folder", path: "/documents" },
];

const CONSULTANT_NAV = [
  { label: "Klien", icon: "group", path: "/dashboard/consultant/clients" },
  { label: "Tanya AI", icon: "psychology", path: "/ai" },
  { label: "Riwayat", icon: "history", path: "/history/consultant" },
  { label: "Jadwal", icon: "calendar_today", path: "/schedule" },
];

export default function BottomNav({ role = "client" }) {
  const pathname = usePathname();
  const navItems = role === "konsultan" ? CONSULTANT_NAV : CLIENT_NAV;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-dark/90 border-t border-muted/30 z-50 backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around w-full px-4 py-4">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={idx}
              href={item.path}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 group w-16 ${
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