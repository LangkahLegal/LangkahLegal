"use client";

import { MaterialIcon, BrandLogo } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role = "client" }) {
  const pathname = usePathname();

  const NAV_ITEMS =
    role === "konsultan"
      ? [
          { label: "Klien", icon: "group", path: "/dashboard/consultant/clients" },
          { label: "Tanya AI", icon: "psychology", path: "/ai" },
          { label: "Riwayat", icon: "history", path: "/history/consultant" },
          { label: "Jadwal", icon: "calendar_today", path: "/schedule" },
        ]
      : [
          { label: "Konsultasi", icon: "gavel", path: "/konsultasi" },
          { label: "Tanya AI", icon: "psychology", path: "/ai" },
          { label: "Riwayat", icon: "history", path: "/history/client" },
          { label: "Berkas", icon: "folder", path: "/documents" },
        ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark border-r border-white/5 p-6 z-50 hidden lg:flex flex-col">
      {/* Logo Area */}
      <div className="mb-12 px-2">
        <BrandLogo iconSize="text-3xl" textSize="text-xl" />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-primary/10 text-primary-light border border-primary/20 shadow-lg shadow-primary/10"
                  : "text-muted hover:bg-white/5 hover:text-main"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                className={`text-2xl transition-colors ${
                  isActive ? "text-primary-light" : "opacity-70 group-hover:opacity-100"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              />
              <span
                className={`font-medium transition-colors ${
                  isActive ? "text-white" : ""
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