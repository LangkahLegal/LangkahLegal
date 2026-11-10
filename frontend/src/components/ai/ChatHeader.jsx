"use client";

import React from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ChatHeader({
  name = "Kia",
  status = "Online",
  onToggleSidebar,
  showSidebarToggle = false,
}) {
  const isOnline = status.toLowerCase() === "online";
  const router = useRouter();

  return (
    <header className="flex justify-between items-center w-full min-h-16 px-6 py-2.5 lg:px-8 lg:py-2.5 bg-header text-on-header sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center">
        {/* Sidebar toggle — visible on all screens */}
        {showSidebarToggle && (
          <Button
            variant="ghost"
            onClick={onToggleSidebar}
            className="!p-0 !w-9 !h-9 !rounded-xl border border-transparent text-on-header hover:bg-header-hover! hover:text-on-header! transition-all mr-3"
            aria-label="Toggle riwayat chat"
          >
            <MaterialIcon name="menu" className="text-xl text-on-header" />
          </Button>
        )}

        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-on-header/95 border-2 border-sidebar-border shadow-soft shrink-0">
            <Image
              src="/images/statue.png"
              alt={name}
              fill
              sizes="36px"
              className="object-contain pt-0.5 px-0.5"
              priority
            />
          </div>

          <div>
            <h1 className="text-on-header font-headline font-bold text-base lg:text-lg leading-tight">
              {name}
            </h1>
            {isOnline ? (
              <p
                className="inline-flex items-center w-fit rounded-full bg-header-online text-success text-[10px] font-black tracking-[0.15em] uppercase transition-colors mt-0.5"
                style={{
                  paddingInline: "var(--header-online-px)",
                  paddingBlock: "var(--header-online-py)",
                }}
              >
                {status}
              </p>
            ) : (
              <p className="text-[10px] font-black tracking-[0.15em] uppercase transition-colors text-header-muted">
                {status}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          onClick={() => router.push("/setting")}
          className="group text-on-header hover:bg-header-hover! transition-all"
          aria-label="Settings"
        >
          <MaterialIcon
            name="settings"
            className="text-on-header group-hover:rotate-45 transition-all duration-500 text-xl"
          />
        </Button>
      </div>
    </header>
  );
}
