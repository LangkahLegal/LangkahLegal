"use client";

import { MaterialIcon, BrandLogo } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarAdmin() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: "Dashboard", icon: "dashboard", path: "dashboard/admin" },
    { label: "Verifikasi", icon: "verified_user", path: "/verification" },
    { label: "Manajemen RAG", icon: "psychology", path: "/rag" },
    { label: "Monitoring", icon: "monitoring", path: "/monitoring" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0e0c1e] border-r border-white/5 p-6 z-50 hidden lg:flex flex-col">
      
      {/* Logo */}
      <div className="mb-12 px-2">
        <BrandLogo iconSize="text-3xl" textSize="text-xl" />
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? "bg-[#6f59fe]/10 text-[#ada3ff] border border-[#6f59fe]/20 shadow-lg"
                  : "text-[#aca8c1] hover:bg-white/5 hover:text-white"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                className={`text-2xl ${
                  isActive ? "text-[#ada3ff]" : "opacity-70 group-hover:opacity-100"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              />

              <span className={`font-medium ${isActive ? "text-white" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}