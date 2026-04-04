import React from "react";

const DEFAULT_CATEGORIES = [
  { id: "bisnis", label: "Bisnis & UKM", active: true },
  { id: "keluarga", label: "Keluarga", active: false },
  { id: "properti", label: "Properti", active: false },
  { id: "pajak", label: "Pajak", active: false },
  { id: "pidana", label: "Pidana", active: false },
];

export default function CategoryList({
  categories = DEFAULT_CATEGORIES,
  onSelect,
}) {
  return (
    <section className="w-full space-y-6">
      <h2 className="text-xl font-headline font-bold text-white px-1">
        Kategori Hukum
      </h2>

      {/* Container Scroll Horizontal */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 -mb-4 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect && onSelect(category.id)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 whitespace-nowrap text-sm ${
              category.active
                ? "bg-[#e8e2fc]/10 text-[#e8e2fc] font-semibold border-[#ada3ff]/50 shadow-[0_0_20px_rgba(173,163,255,0.1)]"
                : "bg-[#131125] text-[#aca8c1] border-[#48455a] hover:border-[#ada3ff]/30"
            }`}
          >
            {/* Status Indicator Dot */}
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                category.active ? "bg-[#ada3ff] animate-pulse" : "bg-[#48455a]"
              }`}
            />
            {category.label}
          </button>
        ))}
      </div>
    </section>
  );
}
