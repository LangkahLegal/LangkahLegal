"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

/**
 * CategoryList Component
 * Refactored to be fully Theme Aware & uses the custom Button component
 */
export default function CategoryList({
  title = "Kategori Hukum",
  categories = [],
  activeCategory,
  onCategoryChange,
  useStyledTitle = false,
}) {
  return (
    <section className="w-full space-y-6">
      {useStyledTitle ? (
        <div className="flex items-center gap-3 px-1">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
          <h2 className="text-base sm:text-lg font-black text-main uppercase tracking-tight font-headline">
            {title}
          </h2>
        </div>
      ) : (
        <h2 className="text-xl font-headline font-black text-main px-1 tracking-tight">
          {title}
        </h2>
      )}

      {/* Container dengan scroll horizontal halus */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 -mb-4 no-scrollbar scroll-smooth px-1">
        {categories.map((category) => {
          const isActive = category.id === activeCategory;

          return (
            <Button
              key={category.id}
              variant={isActive ? "primary" : "secondary"}
              onClick={() => onCategoryChange?.(category.id)}
              className={`
                !px-5 !py-2.5 !rounded-full !text-xs !font-bold border whitespace-nowrap transition-all duration-300
                ${
                  isActive
                    ? "!bg-primary/10 !text-primary !border-primary/40 shadow-soft"
                    : "!bg-input/50 !text-muted !border-surface hover:!border-primary/30"
                }
              `}
            >
              {/* Dot Indicator: Theme Aware */}
              <span
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${
                    isActive
                      ? "bg-primary-light animate-pulse scale-110 shadow-[0_0_8px_var(--primary-light)]"
                      : "bg-muted/30"
                  }
                `}
              />
              <span className="tracking-wide uppercase text-[10px]">
                {category.label}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
