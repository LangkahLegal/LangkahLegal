"use client";

import React, { useState } from "react";

// ==========================================
// ICONS
// ==========================================

export const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const MaterialIcon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>
    {name}
  </span>
);

// ==========================================
// BUTTON
// ==========================================

export function Button({ children, variant = "primary", className = "", ...props }) {
  let baseClass = "";
  if (variant === "primary") baseClass = "btn-primary";
  if (variant === "social") baseClass = "btn-social";
  if (variant === "icon") baseClass = "btn-icon";

  return (
    <button className={`${baseClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

// ==========================================
// INPUT FIELD
// ==========================================

export function InputField({ label, id, name, type = "text", placeholder, value, onChange, required = false, className = "" }) {
  const inputId = id || name;
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="form-input"
      />
    </div>
  );
}

// ==========================================
// PASSWORD FIELD
// ==========================================

export function PasswordField({ label = "Password", id = "password", name = "password", placeholder = "••••••••", value, onChange, required = false, className = "" }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="form-input-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="password-toggle"
          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
        >
          <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
        </button>
      </div>
    </div>
  );
}