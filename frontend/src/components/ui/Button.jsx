import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  fullWidth = false,
  ...props
}) {
  // Mapping class CSS berdasarkan variant
  const variants = {
    // Varian bawaan kamu sebelumnya
    primary: "btn-primary",
    social: "btn-social",
    icon: "btn-icon",
    outline: "btn-outline",
    danger: "py-3 rounded-xl bg-[#ff6e84]/10 border border-[#ff6e84]/50 text-[#ff6e84] hover:bg-[#ff6e84] hover:text-white transition-all",
    ghost: "py-3 rounded-xl bg-white/5 text-[#aca8c1] hover:bg-white/10 transition-colors",
    secondary: "bg-[#2c2945] text-[#aca8c1] hover:bg-[#3d3a5e]",
  };

  // Base style agar semua tombol punya struktur dasar yang sama (padding, font, dll)
  // Atur style ini file CSS (btn-primary dkk) 
  const baseStyles = "transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50";
  
  const variantClass = variants[variant] || variants.primary;
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variantClass} ${widthClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
}