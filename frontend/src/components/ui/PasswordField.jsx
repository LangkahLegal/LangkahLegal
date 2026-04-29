"use client";

import React, { useState } from "react";
import { MaterialIcon } from "./Icons";
import { Button } from "./Button"; // Import komponen Button Anda

export function PasswordField({
  label = "Password",
  id = "password",
  name = "password",
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block font-headline text-[11px] font-bold uppercase tracking-[0.12em] text-muted ml-1"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          className={`
            w-full font-headline text-sm 
            bg-input border border-surface rounded-xl 
            p-4 pr-14 
            text-main placeholder:text-muted/30
            transition-all duration-300 outline-none 
            focus:border-primary focus:ring-1 focus:ring-primary/20
          `}
          {...props}
        />

        {/* REFACTOR: Menggunakan komponen Button varian 'icon' */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button
            type="button"
            variant="icon"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-muted/50 hover:text-primary !p-2"
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
          >
            <MaterialIcon
              name={showPassword ? "visibility_off" : "visibility"}
              className="text-[22px]"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
