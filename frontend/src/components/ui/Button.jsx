import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "btn-primary",
    social: "btn-social",
    icon: "btn-icon",
    outline: "btn-outline", // Menambahkan variant outline untuk Landing Page kamu
  };

  const baseClass = variants[variant] || variants.primary;

  return (
    <button className={`${baseClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
