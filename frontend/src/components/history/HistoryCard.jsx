"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button"; // Menggunakan komponen Button kamu

export default function HistoryCard({ item, role = "client" }) {
  const isActive = item.status === "Berlangsung";
  let statusClasses = "";
  let isDimmed = false;

  // Pemetaan Status menggunakan variabel tema
  switch (item.status) {
    case "Berlangsung":
      statusClasses = "bg-primary text-white shadow-soft";
      break;
    case "Selesai":
      statusClasses = "bg-primary/10 text-primary-light";
      break;
    case "Terjadwal":
      statusClasses = "bg-emerald-500/10 text-emerald-500";
      break;
    case "Pending":
      statusClasses = "bg-cyan-500/10 text-cyan-400";
      break;
    case "Menunggu Pembayaran":
      statusClasses = "bg-amber-500/10 text-amber-400";
      break;
    case "Dibatalkan":
    case "Ditolak":
    case "Kedaluwarsa":
    case "Pembayaran Gagal":
      statusClasses = "bg-danger/10 text-danger";
      isDimmed = true;
      break;
    default:
      statusClasses = "bg-surface text-muted";
  }

  const subtitle =
    role === "konsultan"
      ? `Rp${item.price?.toLocaleString("id-ID") || "0"}`
      : item.role;

  return (
    <div
      className={`group p-4 sm:p-5 rounded-[2rem] border transition-all duration-300 ${
        isActive
          ? "bg-primary/5 border-primary/20 shadow-soft"
          : "bg-card border-surface hover:border-primary/20"
      } ${isDimmed ? "opacity-60 grayscale-[30%]" : ""}`}
    >
      {/* BAGIAN ATAS: Avatar, Info, & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Avatar Section */}
          <div className="relative shrink-0">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden border-2 bg-input transition-colors ${
                isActive ? "border-primary" : "border-surface"
              }`}
            >
              <img
                src={item.avatar}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-bg rounded-full animate-pulse" />
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-1">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-main group-hover:text-primary-light transition-colors truncate">
              {item.name}
            </h3>
            <p
              className={`text-[10px] sm:text-xs truncate font-semibold uppercase tracking-wider ${
                role === "konsultan" ? "text-primary-light" : "text-muted"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Badge Status */}
        <span
          className={`shrink-0 text-[9px] sm:text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest uppercase transition-colors ${statusClasses}`}
        >
          {item.status}
        </span>
      </div>

      {/* BAGIAN BAWAH: Waktu & Action */}
      <div className="mt-5 pt-4 border-t border-surface flex justify-between items-center gap-2">
        {/* Kiri: Tombol Gabung ATAU Info Waktu */}
        <div className="flex-1 min-w-0">
          {isActive ? (
            <Button
              variant="ghost"
              className="!p-0 !h-auto !bg-transparent text-primary-light hover:text-primary hover:gap-3 transition-all"
            >
              <MaterialIcon name="videocam" className="text-lg" />
              <span className="text-xs sm:text-sm">Gabung Sesi</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-muted text-[10px] sm:text-xs font-medium">
              <MaterialIcon name="calendar_today" className="text-sm" />
              <span className="truncate">
                {item.date ? `${item.date}, ${item.time}` : item.time}
              </span>
            </div>
          )}
        </div>

        {/* Kanan: Tombol Lihat Detail */}
        <Button
          variant="ghost"
          className={`!p-0 !h-auto !bg-transparent text-sm transition-all shrink-0 ${
            isActive ? "text-main" : "text-primary-light"
          }`}
        >
          {!isActive && (
            <span className="hidden sm:inline mr-1">Lihat Detail</span>
          )}
          <MaterialIcon
            name={isActive ? "arrow_forward" : "chevron_right"}
            className="text-xl group-hover:translate-x-1 transition-transform"
          />
        </Button>
      </div>
    </div>
  );
}
