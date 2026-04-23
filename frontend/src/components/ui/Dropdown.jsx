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
        className="form-input dropdown-trigger flex items-center justify-between w-full">
        <span className="truncate text-left flex-1">
          {value || placeholder}
        </span>
        
        <span 
          className={`material-symbols-outlined text-[18px] transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--text-muted)' }}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="dropdown-menu custom-scrollbar animate-fade-in absolute w-full z-50">
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
                className={`dropdown-item flex items-center justify-between ${isSelected ? "active" : ""}`}>
                <div className="text-left flex-1">
                  {renderItem ? renderItem(opt) : (opt.label || opt)}
                </div>
                
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px] shrink-0 ml-2">
                    check
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}