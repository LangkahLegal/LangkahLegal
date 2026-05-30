"use client";

import React, { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

/**
 * PillDropdown — looks like a CategoryList pill-button,
 * but opens a dropdown menu on click.
 */
export default function PillDropdown({
  icon,
  options = [],
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.id === value);
  const isDefault = value === options[0]?.id;

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger — pill shape identical to CategoryList */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`
          inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border
          whitespace-nowrap transition-all duration-300 cursor-pointer select-none
          ${
            !isDefault
              ? "bg-primary/10 text-primary border-primary/40 shadow-soft"
              : "bg-input/50 text-muted border-surface hover:border-primary/30"
          }
        `}
      >
        {/* Dot indicator */}
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            !isDefault
              ? "bg-primary-light animate-pulse scale-110 shadow-[0_0_8px_var(--primary-light)]"
              : "bg-muted/30"
          }`}
        />

        {icon && <MaterialIcon name={icon} className="text-sm -ml-0.5" />}

        <span className="tracking-wide uppercase text-[10px]">
          {selected?.label || options[0]?.label}
        </span>

        <MaterialIcon
          name="expand_more"
          className={`text-base transition-transform duration-300 -mr-1 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 min-w-[180px] bg-dropdown border border-surface rounded-2xl shadow-2xl z-[110] overflow-hidden animate-fade-in backdrop-blur-xl">
          <div className="max-h-60 overflow-y-auto py-2 scrollbar-thin">
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`px-5 py-2.5 text-xs flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : "text-main hover:bg-surface font-medium"
                  }`}
                >
                  <span className="font-headline uppercase tracking-wide">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <MaterialIcon name="check" className="text-sm shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
