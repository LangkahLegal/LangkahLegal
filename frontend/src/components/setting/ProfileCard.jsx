"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";

export default function ProfileCard({ user }) {
  const { name, email, foto_profil, role, status_verifikasi } = user;

  // Fallback URL tetap pakai hex karena API eksternal (UI Avatars) membutuhkannya
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=1f1d35&color=ada3ff&size=128`;

  // HELPER: Warna Status yang Theme-Aware
  const getStatusStyles = (status) => {
    switch (status) {
      case "terverifikasi":
        return "text-primary-light"; // Menggunakan var primary
      case "pending":
        return "text-amber-500"; // Warna standar warning
      case "ditolak":
        return "text-danger"; // Menggunakan var danger
      default:
        return "text-muted"; // Menggunakan var muted
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "terverifikasi":
        return "Terverifikasi";
      case "pending":
        return "Menunggu Verifikasi";
      case "ditolak":
        return "Verifikasi Ditolak";
      default:
        return "Belum Mengajukan";
    }
  };

  return (
    <section>
      {/* REFACTOR WARNA: 
         1. bg-[#1f1d35] -> bg-card
         2. border manual -> border-surface
      */}
      <div className="bg-card border border-surface rounded-[2rem] p-6 shadow-soft relative overflow-hidden transition-colors duration-500">
        {/* Dekorasi Glow: bg-[#ada3ff]/10 -> bg-primary/10 */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />

        <div className="flex items-center gap-5 relative z-10">
          {/* Avatar Area */}
          <div className="relative flex-shrink-0">
            {/* bg-[#2c2945] -> bg-input | border manual -> border-surface */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-input border-2 border-surface shadow-inner">
              <img
                key={foto_profil}
                src={foto_profil || fallbackUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = fallbackUrl;
                }}
              />
            </div>
          </div>

          {/* Info Area */}
          <div className="flex flex-col gap-0.5">
            {/* text-[#e8e2fc] -> text-main */}
            <h2 className="font-headline font-bold text-lg text-main mt-1">
              {name}
            </h2>
            {/* text-[#aca8c1] -> text-muted */}
            <p className="text-muted text-sm font-medium">{email}</p>

            {/* Role & Status Badge */}
            {role === "konsultan" && (
              /* bg-white/5 -> bg-surface | border manual -> border-surface */
              <div className="inline-flex w-fit items-center justify-center px-3 py-1 mt-1.5 rounded-full bg-surface border border-surface backdrop-blur-sm">
                <span
                  className={`text-[10px] lg:text-xs font-black tracking-widest uppercase leading-none pt-[2px] ${getStatusStyles(
                    status_verifikasi,
                  )}`}
                >
                  {getStatusText(status_verifikasi)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
