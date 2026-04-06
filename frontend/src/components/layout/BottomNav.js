"use client";

import { MaterialIcon } from "@/components/ui";
import { usePathname } from "next/navigation"; // Import hook untuk deteksi URL
import Link from "next/link"; // Gunakan Link agar navigasi cepat

const CLIENT_NAV = [
  { label: "Konsultasi", icon: "gavel", path: "/konsultasi" },
  { label: "Tanya AI", icon: "psychology", path: "/dashboard/client/ai" },
  { label: "Riwayat", icon: "history", path: "/dashboard/client/history" },
  { label: "Berkas", icon: "folder", path: "/dashboard/client/documents" },
];

const CONSULTANT_NAV = [
  { label: "Klien", icon: "group", path: "/dashboard/consultan/clients" },
  { label: "Tanya AI", icon: "psychology", path: "/dashboard/consultan/ai" },
  { label: "Riwayat", icon: "history", path: "/dashboard/consultan/history" },
  {
    label: "Jadwal",
    icon: "calendar_today",
    path: "/dashboard/consultan/schedule",
  },
];

export default function BottomNav({ role = "client" }) {
  const pathname = usePathname(); // Ambil URL saat ini
  const navItems = role === "konsultan" ? CONSULTANT_NAV : CLIENT_NAV;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0e0c1e]/90 border-t border-[#48455a]/30 z-50 backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around w-full px-4 py-4">
        {navItems.map((item, idx) => {
          // LOGIKA FIX: Item aktif HANYA jika pathname sama persis dengan path item
          // Jika kamu berada di /dashboard/client, maka tidak ada item yang aktif (Idle)
          const isActive = pathname === item.path;

          return (
            <Link
              key={idx}
              href={item.path}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 group w-16 ${
                isActive
                  ? "text-[#e8e2fc]"
                  : "text-[#aca8c1] hover:text-[#e8e2fc]"
              }`}
            >
              <div className="relative">
                <MaterialIcon
                  name={item.icon}
                  className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-[#ada3ff]" : ""
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                />

                {/* Indikator Titik Aktif */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#ada3ff] rounded-full shadow-[0_0_8px_#ada3ff]" />
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
