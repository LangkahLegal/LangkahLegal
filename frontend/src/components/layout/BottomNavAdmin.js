"use client";

import { MaterialIcon } from "@/components/ui";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ADMIN_NAV = [
  { label: "Dashboard", icon: "dashboard", path: "dashboard/admin" },
  { label: "Verifikasi", icon: "verified_user", path: "/verification" },
  { label: "RAG", icon: "psychology", path: "/rag" },
  { label: "Monitor", icon: "monitoring", path: "/monitoring" },
];

export default function BottomNavAdmin({ className = "" }) {
  const pathname = usePathname();

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 bg-[#0e0c1e]/90 border-t border-white/10 z-50 backdrop-blur-xl lg:hidden ${className}`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around w-full px-4 py-4">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 group w-16 ${
                isActive ? "text-white" : "text-[#aca8c1] hover:text-white"
              }`}
            >
              <div className="relative">
                <MaterialIcon
                  name={item.icon}
                  className={`text-2xl ${
                    isActive ? "text-[#ada3ff]" : ""
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                />

                {isActive && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#ada3ff] rounded-full shadow-[0_0_8px_#ada3ff]" />
                )}
              </div>

              <span
                className={`text-[10px] uppercase tracking-widest ${
                  isActive ? "font-bold" : "opacity-70"
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