"use client";
import React, { useState } from "react";
import { MaterialIcon } from "./Icons";

export function PasswordField({
  label = "Password",
  id = "password",
  name = "password",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`form-field ${props.className || ""}`.trim()}>
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
          className="form-input-password"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="password-toggle"
        >
          <MaterialIcon
            name={showPassword ? "visibility_off" : "visibility"}
            className="text-xl"
          />
        </button>
      </div>
    </div>
  );
}
