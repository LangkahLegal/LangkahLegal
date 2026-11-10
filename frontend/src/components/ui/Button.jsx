import React from "react";
import { Spinner } from "./Spinner";

export function Button({
  children,
  variant = "primary",
  className = "",
  fullWidth = false,
  isLoading = false,
  ...props
}) {
  const variants = {
    // CTA utama memakai aksen honey bronze
    primary:
      "bg-secondary text-on-secondary border border-transparent shadow-soft hover:bg-secondary-hover active:scale-[0.98]",
    // Aksi pendukung memakai soft teal
    secondary:
      "bg-primary-soft text-primary border border-primary/30 hover:bg-primary/20 active:scale-[0.98]",
    // Menggunakan surface tema
    social:
      "bg-surface border border-surface text-main font-semibold hover:bg-surface/80 active:scale-[0.98]",
    icon: "p-2 rounded-full hover:bg-surface active:scale-90 text-inherit border-none",
    outline: "border border-surface bg-transparent hover:bg-surface text-main",
    danger:
      "bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20",
    ghost: "bg-transparent hover:bg-surface text-muted hover:text-main",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const sizeClass =
    variant === "icon"
      ? ""
      : "gap-2.5 lg:gap-2 px-5 py-3 lg:px-4 lg:py-2.5 rounded-xl";

  return (
    <button
      className={`
        inline-flex items-center justify-center 
        ${sizeClass}
        font-bold
        text-sm
        transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary} 
        ${widthClass} 
        ${className}
      `.trim()}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="tracking-wide">Memproses...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
