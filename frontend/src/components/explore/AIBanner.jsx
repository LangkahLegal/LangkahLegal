"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function AIBanner({ onAction }) {
  return (
    <section className="w-full">
      <div
        className={`
          relative overflow-hidden 
          bg-primary p-6 lg:p-7 
          rounded-2xl 
          flex flex-col lg:flex-row lg:items-center justify-between 
          gap-6 transition-all duration-500
          shadow-soft
        `}
      >
        {/* Konten Teks */}
        <div className="space-y-2.5 z-10 relative">
          {/* JUDUL: Menggunakan text-bg agar selalu kontras dengan background primary */}
          <h2
            className={`
              text-xl sm:text-2xl 
              font-headline font-bold 
              text-bg leading-[1.15] tracking-tight
              max-w-xs sm:max-w-sm lg:max-w-lg
            `}
          >
            Konsultasi AI Tersedia 24/7
          </h2>

          {/* DESKRIPSI: text-bg/70 untuk kesan muted tapi tetap terbaca */}
          <p
            className={`
              text-bg/75 text-xs sm:text-sm 
              leading-relaxed font-medium
              max-w-xs sm:max-w-md md:max-w-xl
            `}
          >
            Dapatkan jawaban hukum instan sebelum bicara dengan pakar.
          </p>

          <div className="pt-2">
            {/* BUTTON: Menggunakan komponen Button dengan override warna khusus */}
            <Button
              onClick={onAction}
              className="!bg-bg !text-main !rounded-full !px-6 !py-2.5 !text-sm shadow-lg hover:scale-105 active:scale-95"
            >
              Coba Sekarang
            </Button>
          </div>
        </div>

        {/* --- ICON DEKORATIF --- */}
        {/* Menggunakan text-bg/20 agar ikon menyatu dengan tema banner */}
        <div className="absolute -bottom-6 -right-4 opacity-20 pointer-events-none rotate-12">
          <MaterialIcon
            name="auto_awesome"
            className="text-[8rem] lg:text-[10rem] text-bg"
          />
        </div>

        <div className="absolute top-6 right-16 opacity-10 pointer-events-none">
          <MaterialIcon name="star" className="text-3xl text-bg" />
        </div>
      </div>
    </section>
  );
}
