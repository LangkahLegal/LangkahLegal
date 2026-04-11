"use client";

import React, { useState, useRef, useEffect } from "react";

export function Dropdown({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = "Pilih...", 
  className = "",
  renderItem 
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

  return (
    <div className={`form-field relative ${className}`} ref={dropdownRef}>
      {label && <label className="form-label">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input dropdown-trigger"
      >
        <span className="truncate">{value || placeholder}</span>
        <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="dropdown-menu custom-scrollbar animate-fade-in">
          {options.map((opt) => {
            const isSelected = (opt.value || opt) === value;
            return (
              <div
                key={opt.value || opt}
                onClick={() => {
                  onChange(opt.value || opt);
                  setIsOpen(false);
                }}
                className={`dropdown-item ${isSelected ? "active" : ""}`}
              >
                {renderItem ? renderItem(opt) : (opt.label || opt)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}