"use client";

import React, { useState, useRef, useEffect } from "react";

export function Dropdown({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = "Pilih...", 
  className = "",
  renderItem // Optional: untuk custom tampilan item (misal pake icon)
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Menutup dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative flex-1 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider block mb-1.5">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50 transition-colors"
      >
        <span className="truncate">{value || placeholder}</span>
        <span className={`material-symbols-outlined text-[#aca8c1] text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[105%] max-h-48 overflow-y-auto bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] py-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <div
              key={opt.value || opt}
              onClick={() => {
                onChange(opt.value || opt);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-[#6f59fe]/20 
                ${(opt.value || opt) === value ? "text-[#ada3ff] font-bold bg-[#6f59fe]/10" : "text-[#e8e2fc]"}`}
            >
              {renderItem ? renderItem(opt) : (opt.label || opt)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}