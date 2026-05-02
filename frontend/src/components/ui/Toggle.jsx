"use client";

import React from "react";
import { Button } from "./Button";

export function Toggle({ enabled, onChange, className = "" }) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={() => onChange(!enabled)}

      className={`
        !p-1 !h-7 !w-14 !min-w-[56px] rounded-full transition-all duration-500 border
        ${enabled ? "bg-primary border-primary" : "bg-surface border-border"} 
        ${className}
      `.trim()}
    >
      <div

        className={`
          bg-secondary rounded-full shadow-sm transition-all duration-300
          h-5 w-5 flex-shrink-0
          ${enabled ? "translate-x-3.5" : "-translate-x-3.5"}
        `}
      />
    </Button>
  );
}
