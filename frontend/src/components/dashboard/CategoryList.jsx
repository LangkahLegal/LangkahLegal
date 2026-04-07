import React from "react";

export default function CategoryList({
  categories = [],
  activeCategory, // Terima state string dari parent
  onCategoryChange, // Terima fungsi handler dari parent
}) {
  return (
    <section className="w-full space-y-6">
      <h2 className="text-xl font-headline font-bold text-white px-1">
        Kategori Hukum
      </h2>

      {/* Container Scroll Horizontal */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 -mb-4 no-scrollbar">
        {categories.map((category) => {
          // LOGIKA FIX: Bandingkan ID kategori dengan state activeCategory dari parent
          const isActive = category.id === activeCategory;

          return (
            <button
              key={category.id}
              // Gunakan handler yang dikirim dari parent
              onClick={() => onCategoryChange && onCategoryChange(category.id)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 whitespace-nowrap text-sm ${
                isActive
                  ? "bg-[#e8e2fc]/10 text-[#e8e2fc] font-semibold border-[#ada3ff]/50 shadow-[0_0_20px_rgba(173,163,255,0.1)]"
                  : "bg-[#131125] text-[#aca8c1] border-[#48455a] hover:border-[#ada3ff]/30"
              }`}
            >
              {/* Status Indicator Dot */}
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  isActive ? "bg-[#ada3ff] animate-pulse" : "bg-[#48455a]"
                }`}
              />
              {category.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
