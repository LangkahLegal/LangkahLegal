"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ChatHeader({
  name = "Visi",
  status = "Online",
  onToggleSidebar,
  showSidebarToggle = false,
}) {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1f1d35&color=ada3ff&size=128`;

  const isOnline = status.toLowerCase() === "online";
  const router = useRouter();

  return (
    <header className="flex justify-between items-center px-6 py-3 lg:px-10 lg:py-4 border-b border-surface bg-bg/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center">
        {/* Sidebar toggle — visible on all screens */}
        {showSidebarToggle && (
          <Button
            variant="ghost"
            onClick={onToggleSidebar}
            className="!p-0 !w-9 !h-9 lg:!w-10 lg:!h-10 !rounded-xl border border-transparent hover:bg-surface transition-all mr-3"
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

      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          onClick={() => router.push("/setting")}
          className="group hover:bg-primary/10 transition-all"
          aria-label="Settings"
        >
          <MaterialIcon
            name="settings"
            className="text-muted group-hover:text-primary group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
          />
        </Button>
      </div>
    </header>
  );
}
