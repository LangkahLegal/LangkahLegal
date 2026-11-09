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
      className={`fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 lg:hidden transition-colors duration-500 ${className}`}
    >
      <div className="max-w-md mx-auto flex items-stretch justify-around w-full px-3 py-1.5 gap-1">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={idx}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 group flex-1 max-w-[84px] py-1.5 px-2 rounded-b-xl border-t-2 ${
                isActive
                  ? "bg-sidebar-active text-sidebar-active-text border-secondary"
                  : "border-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
              }`}
            >
              <div className="relative">
                <MaterialIcon
                  name={item.icon}
                  className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                    isActive
                      ? "text-sidebar-active-text"
                      : "text-sidebar-muted group-hover:text-sidebar-text"
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                />
              </div>

              <span
                className={`text-[10px] uppercase tracking-widest transition-all truncate max-w-full ${
                  isActive ? "font-bold" : "font-medium"
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
