"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function ChatHeader({
  name = "Kia",
  status = "Online",
  onToggleSidebar,
  showSidebarToggle = false,
}) {
  // Fallback URL tetap menggunakan hex karena API eksternal membutuhkannya
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1f1d35&color=ada3ff&size=128`;

  const isOnline = status.toLowerCase() === "online";

  return (
    <header className="flex justify-between items-center py-5 border-b border-surface bg-bg/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center">
        {/* Sidebar toggle — visible on all screens */}
        {showSidebarToggle && (
          <Button
            variant="icon"
            onClick={onToggleSidebar}
            className="!text-muted hover:!text-main transition-all"
            aria-label="Toggle riwayat chat"
          >
            <MaterialIcon name="menu" className="text-xl" />
          </Button>
        )}

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


    </header>
  );
}
