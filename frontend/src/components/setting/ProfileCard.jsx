"use client";

import React from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function ProfileCard({ user }) {
  const { name, email, foto_profil, role, status_verifikasi } = user;

  // HELPER: Warna Status yang Theme-Aware
  const getStatusStyles = (status) => {
    switch (status) {
      case "terverifikasi":
        return "bg-success-soft text-success border-success/20";
      case "pending":
        return "bg-secondary-soft text-secondary-text border-secondary/20";
      case "ditolak":
        return "bg-danger-soft text-danger border-danger/20";
      default:
        return "bg-surface text-muted border-surface";
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
      <div className="bg-card bg-gradient-hero border border-surface rounded-2xl p-4 sm:p-5 shadow-soft relative overflow-hidden transition-colors duration-500">
        {/* Dekorasi Glow Bronze */}
        <div className="pointer-events-none absolute -right-10 -top-10 w-36 h-36 bg-secondary-soft blur-[50px] rounded-full" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar Area */}
          <div className="relative flex-shrink-0">
            {/* bg-[#2c2945] -> bg-input | border manual -> border-surface */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-input border-2 border-surface shadow-inner">
              <UserAvatar
                src={foto_profil}
                name={name || "User"}
                alt={name || "User"}
                size="lg"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info Area */}
          <div className="flex flex-col gap-0.5">
            {/* text-[#e8e2fc] -> text-main */}
            <h2 className="font-headline font-bold text-base sm:text-lg text-main">
              {name}
            </h2>
            {/* text-[#aca8c1] -> text-muted */}
            <p className="text-muted text-xs sm:text-sm font-medium">{email}</p>

            {/* Role & Status Badge */}
            {role === "konsultan" && (
              <div
                className={`inline-flex w-fit items-center justify-center px-3 py-1 mt-1.5 rounded-full border backdrop-blur-sm ${getStatusStyles(
                  status_verifikasi,
                )}`}
              >
                <span className="text-[10px] lg:text-xs font-black tracking-widest uppercase leading-none pt-[2px]">
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
