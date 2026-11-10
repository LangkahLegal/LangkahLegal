"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button"; // Menggunakan komponen Button kamu
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function HistoryCard({ item, role = "client" }) {
  const isActive = item.status === "Berlangsung";
  let statusClasses = "";
  let isDimmed = false;

  // Pemetaan Status menggunakan variabel tema
  switch (item.status) {
    case "Berlangsung":
      statusClasses = "bg-primary text-on-primary shadow-soft";
      break;
    case "Selesai":
      statusClasses = "bg-success-soft text-success";
      break;
    case "Terjadwal":
      statusClasses = "bg-info-soft text-info-text";
      break;
    case "Pending":
      statusClasses = "bg-primary-soft text-primary-text";
      break;
    case "Menunggu Konsultan":
      statusClasses = "bg-sage-soft text-sage-text";
      break;
    case "Menunggu Pembayaran":
      statusClasses = "bg-secondary-soft text-secondary-text";
      break;
    case "Dibatalkan":
    case "Ditolak":
    case "Kedaluwarsa":
    case "Pembayaran Gagal":
      statusClasses = "bg-danger-soft text-danger";
      isDimmed = true;
      break;
    default:
      statusClasses = "bg-surface text-muted";
  }

  const subtitle =
    item.status === "Menunggu Konsultan"
      ? "Kasus dipublikasikan ke Bursa"
      : role === "konsultan"
        ? `Rp${item.price?.toLocaleString("id-ID") || "0"}`
        : item.role;

  return (
    <div
      className={`group p-4 rounded-2xl border border-surface bg-card shadow-soft hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-full ${
        isDimmed ? "opacity-60 grayscale-[30%]" : ""
      }`}
    >
      {/* BAGIAN ATAS: Avatar, Info, & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar Section */}
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 bg-input transition-colors ${isActive ? "border-primary" : "border-surface"
                }`}
            >
              <UserAvatar
                src={item.avatar}
                name={item.name || "User"}
                alt={item.name || "User"}
                size="md"
                className="w-full h-full object-cover"
              />
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-bg rounded-full animate-pulse" />
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-0.5">
            <h3 className="font-bold text-sm sm:text-[15px] text-main group-hover:text-primary-light transition-colors truncate">
              {item.name}
            </h3>
            <p
              className={`text-[10px] sm:text-xs truncate font-semibold uppercase tracking-wider ${role === "konsultan" ? "text-primary-light" : "text-muted"
                }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Badge Status */}
        <span
          className={`shrink-0 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider uppercase transition-colors ${statusClasses}`}
        >
          {item.status}
        </span>
      </div>

      {/* BAGIAN BAWAH: Waktu & Action */}
      <div className="mt-4 pt-3 border-t border-surface flex justify-between items-center gap-2">
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
          className={`!p-0 !h-auto !bg-transparent text-sm transition-all shrink-0 ${isActive ? "text-main" : "text-primary-light"
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
