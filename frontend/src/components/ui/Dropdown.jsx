"use client";

import React, { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "./Icons";
import { Button } from "./Button";

export function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Pilih...",
  className = "",
  renderItem,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => (opt.value || opt) === value);
  const displayLabel = selectedOption
    ? selectedOption.label || selectedOption
    : placeholder;

  return (
    <div
      ref={dropdownRef}
      /* SOLUSI ANTI-KETIMPA: 
         Z-index harus dipasang di wrapper (div) ini. 
         Kalau terbuka kasih z-50, kalau tutup z-10.
      */
      className={`flex flex-col gap-2 relative transition-all duration-300 ${
        isOpen ? "z-[100]" : "z-10"
      } ${className}`}
    >
      {label && (
        <label className="block font-headline text-[11px] font-bold uppercase tracking-[0.12em] text-muted ml-1">
          {label}
        </label>
      )}

      {/* TRIGGER: Menggunakan Button UI */}
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          !justify-between !px-4 !py-4 !font-bold !bg-input !border-surface
          ${isOpen ? "!border-primary ring-2 ring-primary/10 shadow-lg" : ""}
        `}
      >
        <span
          className={`truncate ${!selectedOption ? "text-muted/40" : "text-main"}`}
        >
          {displayLabel}
        </span>
        <MaterialIcon
          name="expand_more"
          className={`text-[22px] transition-transform duration-300 ${
            isOpen ? "rotate-180 text-primary" : "text-muted"
          }`}
        />
      </Button>

      {/* MENU: Melayang & Solid */}
      {isOpen && (
        <div
          className={`
            absolute top-[calc(100%+8px)] left-0 w-full 
            z-[110] /* Harus lebih tinggi dari trigger */
            bg-dropdown border border-surface rounded-xl shadow-2xl py-2 
            max-h-60 overflow-y-auto animate-fade-in
            
            /* SCROLLBAR */
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-muted/30
            [&::-webkit-scrollbar-thumb]:rounded-full
          `}
        >
          {options.map((opt) => {
            const optValue = opt.value || opt;
            const isSelected = optValue === value;

            return (
              <div
                key={optValue}
                onClick={() => {
                  onChange(optValue);
                  setIsOpen(false);
                }}
                className={`
                  mx-2 px-4 py-3 text-sm font-headline flex items-center justify-between cursor-pointer rounded-lg transition-all
                  ${
                    isSelected
                      ? "bg-primary text-white font-bold shadow-md"
                      : "text-main hover:bg-white/10 active:bg-white/20"
                  }
                `}
              >
                <div className="flex-1 truncate">
                  {renderItem ? renderItem(opt) : opt.label || opt}
                </div>
                {isSelected && (
                  <MaterialIcon
                    name="check"
                    className="text-[18px] shrink-0 ml-2"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
