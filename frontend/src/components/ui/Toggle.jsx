"use client";

import React from "react";

export function Toggle({ enabled, onChange, className = "" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`w-14 h-7 rounded-full transition-all duration-300 flex items-center px-1 flex-shrink-0 outline-none ${
        enabled ? "bg-primary" : "bg-white/20"
      } ${className}`.trim()}
    >
      <div
        className={`bg-white rounded-full shadow-md transition-transform duration-300 h-5 w-5 min-w-[20px] min-h-[20px] aspect-square flex-shrink-0 ${
          enabled ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}