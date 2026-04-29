"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button"; // Menggunakan komponen Button Anda

export default function ChatHeader({
  name = "Kia",
  avatarUrl,
  status = "Online",
}) {
  // Fallback URL tetap menggunakan hex karena API eksternal membutuhkannya
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1f1d35&color=ada3ff&size=128`;

  const isOnline = status.toLowerCase() === "online";

  return (
    <header className="flex justify-between items-center px-6 py-5 border-b border-surface bg-bg/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="relative group/avatar">
          {/* Avatar Container: Menggunakan bg-input dan border-primary/30 */}
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 border-primary/30 bg-input shadow-soft">
            <img
              src={avatarUrl || fallbackUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              onError={(e) => {
                e.target.src = fallbackUrl;
              }}
            />
          </div>

          {/* Status Indicator: Border menggunakan border-bg agar menyatu dengan header */}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-bg rounded-full animate-pulse shadow-sm" />
          )}
        </div>

        <div>
          <h1 className="text-main font-headline font-bold text-lg lg:text-xl leading-tight">
            {name}
          </h1>
          <p
            className={`text-[10px] lg:text-xs font-black tracking-[0.15em] uppercase transition-colors ${
              isOnline ? "text-emerald-500" : "text-muted"
            }`}
          >
            {status}
          </p>
        </div>
      </div>

      <div className="flex ml-auto  sm:gap-2">

        <Button
          variant="icon"
          className="!text-muted hover:!text-main transition-all"
          aria-label="Menu Lainnya"
        >
          <MaterialIcon name="more_vert" className="text-xl lg:text-2xl" />
        </Button>
      </div>
    </header>
  );
}
