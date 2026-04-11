import React from "react";

export default function CategoryList({
  categories = [],
  activeCategory,
  onCategoryChange,
}) {
  return (
    <section className="w-full space-y-6">
      <h2 className="text-xl font-headline font-bold text-main px-1">
        Kategori Hukum
      </h2>

      {/* Container Scroll Horizontal */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 -mb-4 custom-scrollbar">
        {categories.map((category) => {
          const isActive = category.id === activeCategory;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange && onCategoryChange(category.id)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 whitespace-nowrap text-sm ${
                isActive
                  ? "bg-main/10 text-main font-semibold border-primary-light/50 shadow-lg shadow-primary-light/10"
                  : "bg-card text-muted border-muted/30 hover:border-primary-light/30"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  isActive ? "bg-primary-light animate-pulse" : "bg-muted/50"
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