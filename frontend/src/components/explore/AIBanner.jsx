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
          bg-primary p-8 lg:p-12 
          rounded-[2.5rem] 
          flex flex-col lg:flex-row lg:items-center justify-between 
          gap-10 transition-all duration-500
          shadow-soft
        `}
      >
        {/* Konten Teks */}
        <div className="space-y-4 z-10 relative">
          {/* JUDUL: Menggunakan text-bg agar selalu kontras dengan background primary */}
          <h2
            className={`
              text-2xl sm:text-3xl lg:text-4xl 
              font-headline font-black 
              text-bg leading-[1.1] tracking-tight
              max-w-xs sm:max-w-sm lg:max-w-lg
            `}
          >
            Konsultasi AI Tersedia 24/7
          </h2>

          {/* DESKRIPSI: text-bg/70 untuk kesan muted tapi tetap terbaca */}
          <p
            className={`
              text-bg/70 text-sm sm:text-base lg:text-lg 
              leading-relaxed font-medium
              max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl
            `}
          >
            Dapatkan jawaban hukum instan sebelum bicara dengan pakar.
          </p>

          <div className="pt-4 lg:pt-2">
            {/* BUTTON: Menggunakan komponen Button dengan override warna khusus */}
            <Button
              onClick={onAction}
              className="!bg-bg !text-main !rounded-full !px-10 !py-6 !text-base lg:!text-lg shadow-xl hover:scale-105 active:scale-95"
            >
              Coba Sekarang
            </Button>
          </div>
        </div>

        {/* --- ICON DEKORATIF --- */}
        {/* Menggunakan text-bg/20 agar ikon menyatu dengan tema banner */}
        <div className="absolute -bottom-10 -right-6 opacity-20 pointer-events-none rotate-12">
          <MaterialIcon
            name="auto_awesome"
            className="text-[14rem] lg:text-[18rem] text-bg"
          />
        </div>

        <div className="absolute top-8 right-20 opacity-10 pointer-events-none">
          <MaterialIcon name="star" className="text-4xl text-bg" />
        </div>
      </div>
    </section>
  );
}
