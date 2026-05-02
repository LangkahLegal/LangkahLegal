import React from "react";

export function InputField({
  label,
  id,
  name,
  type = "text",
  className = "",
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block font-headline text-[11px] font-bold uppercase tracking-[0.12em] text-muted ml-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        className={`
          w-full font-headline text-sm 
          bg-input border border-surface rounded-xl 
          p-4 
          text-main placeholder:text-muted/30
          transition-all duration-300 outline-none 
          focus:border-primary focus:ring-1 focus:ring-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />
    </div>
  );
}
