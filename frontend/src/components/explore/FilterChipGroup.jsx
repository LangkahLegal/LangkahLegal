"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

/**
 * FilterChipGroup Component
 * Reuses the exact same pill-button design from CategoryList
 * so all filter bars look visually consistent.
 *
 * @param {string}   title    – Section label (e.g. "Status")
 * @param {string}   icon     – Material icon name shown before the title
 * @param {Array}    options  – [{ id, label }]
 * @param {string}   active   – Currently selected option id
 * @param {Function} onChange – Called with the selected option id
 */
export default function FilterChipGroup({
  title,
  icon,
  options = [],
  active,
  onChange,
}) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 -mb-4 no-scrollbar scroll-smooth px-1">
      {/* Optional label chip (non-interactive) */}
      {title && (
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted whitespace-nowrap shrink-0 select-none pr-1">
          {icon && <MaterialIcon name={icon} className="text-sm text-muted" />}
          {title}
        </span>
      )}

      {options.map((option) => {
        const isActive = option.id === active;

        return (
          <Button
            key={option.id}
            variant={isActive ? "primary" : "secondary"}
            onClick={() => onChange?.(option.id)}
            className={`
              !px-5 !py-2.5 !rounded-full !text-xs !font-bold border whitespace-nowrap transition-all duration-300
              ${
                isActive
                  ? "!bg-primary/10 !text-primary !border-primary/40 shadow-soft"
                  : "!bg-input/50 !text-muted !border-surface hover:!border-primary/30"
              }
            `}
          >
            {/* Dot Indicator: Theme Aware — identical to CategoryList */}
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
              {option.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
