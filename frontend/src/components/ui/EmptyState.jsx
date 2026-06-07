import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  icon = "folder_open",
  title = "Belum Ada Data",
  description = "Tidak ada informasi yang dapat ditampilkan saat ini.",
  actionLabel,
  onAction,
  actionIcon = "add",
  className = "py-16", // Default padding, can be overriden
  variant = "transparent", // 'transparent' | 'card'
}) {
  const baseClasses = "flex flex-col items-center justify-center text-center w-full animate-fade-in";
  const variantClasses = variant === "card" 
    ? "bg-card border border-surface rounded-[2rem] shadow-soft" 
    : "";

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      <div className="mb-3">
        <MaterialIcon
          name={icon}
          className="text-3xl md:text-4xl text-muted opacity-40"
        />
      </div>
      
      <h3 className="text-sm md:text-base font-bold text-main mb-1.5 tracking-tight">
        {title}
      </h3>
      
      <p className="text-[11px] md:text-xs text-muted max-w-sm mx-auto leading-relaxed mb-4">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="px-6" variant="secondary">
          {actionIcon && <MaterialIcon name={actionIcon} className="text-base" />}
          <span className="text-xs font-bold uppercase tracking-wider">{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}
