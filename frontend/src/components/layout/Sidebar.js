// src/components/layout/Sidebar.jsx
"use client";

import { MaterialIcon } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role = "client" }) {
  const pathname = usePathname();

  // Mapping Navigation Items berdasarkan Role
  const NAV_ITEMS =
    role === "konsultan"
      ? [
          {
            label: "Klien",
            icon: "group",
            path: "/dashboard/consultant/clients",
          },
          { label: "Tanya AI", icon: "psychology", path: "/dashboard/ai" },
          { label: "Riwayat", icon: "history", path: "/dashboard/history" },
          { label: "Jadwal", icon: "calendar_today", path: "/schedule" },
        ]
      : [
          { label: "Konsultasi", icon: "gavel", path: "/konsultasi" },
          { label: "Tanya AI", icon: "psychology", path: "/dashboard/ai" },
          { label: "Riwayat", icon: "history", path: "/dashboard/history" },
          { label: "Berkas", icon: "folder", path: "/dashboard/documents" },
        ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0e0c1e] border-r border-white/5 p-6 z-50 hidden lg:flex flex-col">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <MaterialIcon name="gavel" className="text-[#6f59fe] text-3xl" />
        <span className="text-xl font-bold text-[#e8e2fc] font-headline tracking-tight">
          LangkahLegal
        </span>
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
                  ? "bg-[#6f59fe]/10 text-[#ada3ff] border border-[#6f59fe]/20 shadow-[0_0_20px_rgba(111,89,254,0.1)]"
                  : "text-[#aca8c1] hover:bg-white/5 hover:text-[#e8e2fc]"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                className={`text-2xl transition-colors ${
                  isActive
                    ? "text-[#ada3ff]"
                    : "opacity-70 group-hover:opacity-100"
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
