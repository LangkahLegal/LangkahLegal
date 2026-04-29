import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  fullWidth = false,
  isLoading = false,
  ...props
}) {
  const variants = {
    // Menggunakan var primary & shadow tema
    primary:
      "bg-primary text-white border border-white/10 shadow-soft hover:brightness-110 active:scale-[0.98]",
    // Menggunakan bg-card & text-muted tema
    secondary:
      "bg-card border border-surface text-muted hover:text-main hover:border-muted/30",
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

  return (
    <button
      className={`
        inline-flex items-center justify-center 
        gap-3 
        px-6 py-3.5 
        rounded-xl 
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
          <svg
            className="animate-spin h-4 w-4 text-current"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="tracking-wide">Memproses...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
