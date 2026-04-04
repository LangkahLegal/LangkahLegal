import React from "react";

export function InputField({ label, id, name, type = "text", ...props }) {
  const inputId = id || name;
  return (
    <div className={`form-field ${props.className || ""}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        className="form-input"
        {...props}
      />
    </div>
  );
}
