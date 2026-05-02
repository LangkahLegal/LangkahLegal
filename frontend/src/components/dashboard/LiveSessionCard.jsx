"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function LiveSessionCard({
  clientName,
  caseType,
  time,
  avatar,
}) {
  return (
    <div className="bg-input border border-primary/20 p-6 rounded-[2.5rem] space-y-6 relative overflow-hidden group shadow-soft transition-all duration-300 hover:border-primary/40">
      {/* Header: Badge LIVE & More Menu */}
      <div className="flex justify-between items-center relative z-10">
        <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-primary-light tracking-[0.2em] uppercase">
            LIVE
          </span>
        </div>
        <MaterialIcon
          name="more_vert"
          className="text-muted cursor-pointer hover:text-main transition-colors"
        />
      </div>

      {/* Main Info */}
      <div className="space-y-4 relative z-10">
        <h3 className="text-lg font-headline font-black text-main">
          Konsultasi Berlangsung
        </h3>

        {/* Detail Client Card: Menggunakan bg-surface agar solid & theme-aware */}
        <div className="bg-surface rounded-2xl p-4 flex items-center gap-4 border border-surface group-hover:bg-primary/5 transition-colors duration-300">
          <img
            src={
              avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=random`
            }
            className="w-12 h-12 rounded-xl object-cover border border-surface"
            alt="client"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-main text-sm truncate">
              {clientName}
            </h4>
            <p className="text-xs text-muted truncate font-medium">
              {caseType}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center relative z-10 gap-4">
        <div className="flex items-center gap-2 text-muted shrink-0">
          <MaterialIcon name="calendar_today" className="text-sm" />
          <span className="text-xs font-bold tracking-tight">{time}</span>
        </div>

        {/* Menggunakan Komponen Button Primary Anda */}
        <Button
          variant="primary"
          className="!px-6 !py-3 !text-sm !rounded-xl shadow-soft flex-1 sm:flex-none"
          onClick={() => console.log("Sesi Dimulai")}
        >
          Mulai Sesi
        </Button>
      </div>

      {/* Dekorasi Background Halus */}
      <div className="absolute -bottom-4 -right-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <MaterialIcon name="videocam" className="text-8xl text-primary" />
      </div>
    </div>
  );
}
