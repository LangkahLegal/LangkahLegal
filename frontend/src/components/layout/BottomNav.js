import { MaterialIcon } from "@/components/ui";

const CLIENT_NAV = [
  { label: "Konsultasi", icon: "gavel", active: true, path: "/dashboard" },
  { label: "Tanya AI", icon: "psychology", active: false, path: "/dashboard/ai" },
  { label: "Riwayat", icon: "history", active: false, path: "/dashboard/history" },
  { label: "Berkas", icon: "folder", active: false, path: "/dashboard/documents" },
];

const CONSULTANT_NAV = [
  { label: "Klien", icon: "group", active: false, path: "/consultant/clients" },
  { label: "Tanya AI", icon: "psychology", active: false, path: "/consultant/ai" },
  { label: "Riwayat", icon: "history", active: false, path: "/consultant/history" },
  { label: "Jadwal", icon: "calendar_today", active: false, path: "/consultant/schedule" },
];

export default function BottomNav({ role = "client", items }) {
  const navItems = items ?? (role === "konsultan" ? CONSULTANT_NAV : CLIENT_NAV);

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0e0c1e]/90 border-t border-[#48455a]/30 z-50 backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around w-full px-4 py-4">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 group w-16 ${
              item.active ? "text-[#e8e2fc]" : "text-[#aca8c1] hover:text-[#e8e2fc]"
            }`}
          >
            <div className="relative">
              <MaterialIcon
                name={item.icon}
                className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                  item.active ? "text-[#ada3ff]" : ""
                }`}
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}
              />
              {item.active && (
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#ada3ff] rounded-full shadow-[0_0_8px_#ada3ff]" />
              )}
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest transition-all ${
                item.active
                  ? "font-bold opacity-100"
                  : "font-medium opacity-70 group-hover:opacity-100"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </footer>
  );
}