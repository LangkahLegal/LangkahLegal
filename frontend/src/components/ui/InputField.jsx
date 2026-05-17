import React from "react";

export function InputField({
  label,
  id,
  name,
  type = "text",
  className = "",
  "data-testid": dataTestId,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-2 ml-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-black text-muted uppercase tracking-[0.2em]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        data-testid={dataTestId}
        className={`
          w-full font-headline text-sm 
          bg-input/50 border border-surface rounded-2xl 
          p-4 
          text-main placeholder:text-muted/30
          transition-all duration-300 outline-none 
          hover:border-primary/30
          focus:bg-input focus:border-primary focus:ring-2 focus:ring-primary/10
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />
    </div>
  );
}
