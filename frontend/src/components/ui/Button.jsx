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
    primary: "btn-primary",
    social: "btn-social",
    icon: "btn-icon",
    outline: "btn-outline",
    danger: "btn-danger",
    ghost: "btn-ghost",
    secondary: "btn-secondary",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      // class "btn" berasal dari base style CSS baru kita
      className={`btn ${variants[variant] || variants.primary} ${widthClass} ${className}`.trim()} 
      disabled={isLoading}
      {...props}
    >
      {children}
    </button>
  );
}