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
    // 0D0A1C sebagai bg, FFFFFF 10% sebagai stroke, dan Drop Shadow
    primary: `
      bg-[#0D0A1C] 
      border border-white/10 
      text-white 
      shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] 
      hover:bg-[#16122c] 
      hover:border-white/20 
      hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.9)]
      active:scale-[0.98]
    `,
    secondary:
      "bg-[#1f1d35] border border-white/5 text-[#aca8c1] hover:bg-[#25233d]",
    social: "btn-social",
    icon: "btn-icon",
    outline: "border border-white/20 bg-transparent hover:bg-white/5",
    danger: "bg-rose-500/20 border border-rose-500/50 text-rose-500",
    ghost: "bg-transparent hover:bg-white/5",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`
        btn 
        flex items-center justify-center 
        px-6 py-3 
        rounded-full 
        font-semibold 
        transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary} 
        ${widthClass} 
        ${className}
      `.trim()}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          {/* Spinner Sederhana */}
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
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
          <span>Memproses...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
