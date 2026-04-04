import { MaterialIcon } from "@/components/ui";

const NAV_ITEMS = [
  {
    label: "Konsultasi",
    icon: "gavel", // Diubah dari "scale" agar sesuai screenshot
    active: true,
    path: "/dashboard",
  },
  {
    label: "Tanya AI",
    icon: "psychology", // Diubah dari "smart_toy" (ikon kepala dengan gear/otak)
    active: false,
    path: "/dashboard/ai",
  },
  {
    label: "Riwayat",
    icon: "history",
    active: false,
    path: "/dashboard/history",
  },
  {
    label: "Berkas",
    icon: "folder",
    active: false,
    path: "/dashboard/documents",
  },
];

export default function BottomNav({ items = NAV_ITEMS }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0e0c1e]/90 border-t border-[#48455a]/30 z-50 backdrop-blur-xl">
      <div className="max-w-md mx-auto flex items-center justify-around w-full px-4 py-4">
        {items.map((item, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 group w-16 ${
              item.active
                ? "text-[#e8e2fc]"
                : "text-[#aca8c1] hover:text-[#e8e2fc]"
            }`}
          >
            <div className="relative">
              <MaterialIcon
                name={item.icon}
                className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                  item.active ? "text-[#ada3ff]" : ""
                }`}
                // Menambahkan fill pada icon jika aktif (Material Symbols feature)
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}
              />

              {/* Active Glow Indicator */}
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
