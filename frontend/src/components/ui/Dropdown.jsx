"use client";

import React, { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "./Icons";

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

  const selectedOption = options.find((opt) => (opt.value ?? opt) === value);
  const displayLabel = selectedOption
    ? selectedOption.label ?? selectedOption
    : placeholder;

  return (
    <div
      ref={dropdownRef}
      className={`space-y-3 relative transition-all duration-300 ${
        isOpen ? "z-[100]" : "z-10"
      } ${className}`}
    >
      {/* Label */}
      {label && (
        <div className="flex items-center gap-2 ml-1">
          <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
            {label}
          </label>
        </div>
      )}

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border rounded-2xl p-4 flex justify-between items-center transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-input border-primary ring-2 ring-primary/10"
            : "bg-input/50 border-surface hover:border-primary/30"
        }`}
      >
        <span
          className={`text-sm truncate ${
            !selectedOption ? "text-muted/40" : "text-main"
          }`}
        >
          {displayLabel}
        </span>
        <MaterialIcon
          name="expand_more"
          className={`text-xl transition-transform duration-300 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-primary" : "text-muted"
          }`}
        />
      </div>

      {/* Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-dropdown border border-surface rounded-2xl shadow-2xl z-[110] overflow-hidden animate-fade-in backdrop-blur-xl">
          <div className="max-h-60 overflow-y-auto py-2 scrollbar-thin">
            {options.map((opt) => {
              const optValue = opt.value ?? opt;
              const isSelected = optValue === value;

              return (
                <div
                  key={optValue}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  className={`px-6 py-3 text-sm flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : "text-main hover:bg-surface"
                  }`}
                >
                  <div className="flex-1 truncate font-headline">
                    {renderItem ? renderItem(opt) : opt.label ?? opt}
                  </div>
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

export function SelectDropdown({ label, value, options, isOpen, onToggle, onSelect, className = "" }) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`space-y-3 relative ${isOpen ? "z-[100]" : "z-10"} ${className}`}>
      {label && (
        <div className="flex items-center gap-2 ml-1">
          <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
            {label}
          </label>
        </div>
      )}

      <div
        onClick={onToggle}
        className={`w-full border rounded-2xl p-4 flex justify-between items-center transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-input border-primary ring-2 ring-primary/10"
            : "bg-input/50 border-surface hover:border-primary/30"
        }`}
      >
        <span className="text-sm font-bold text-main">
          {selected?.label ?? "—"}
        </span>
        <MaterialIcon
          name="expand_more"
          className={`text-xl transition-transform duration-300 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-primary" : "text-muted"
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-dropdown border border-surface rounded-2xl shadow-2xl z-[110] overflow-hidden animate-fade-in backdrop-blur-xl">
          <div className="max-h-52 overflow-y-auto py-2 scrollbar-thin">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => onSelect?.(opt.value)}
                  className={`px-6 py-3 text-sm flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : "text-main hover:bg-surface"
                  }`}
                >
                  <span className="font-headline">{opt.label}</span>
                  {isSelected && (
                    <MaterialIcon name="check" className="text-sm" />
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
