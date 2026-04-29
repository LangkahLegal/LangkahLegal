"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";

export default function VisiMisiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-10">
      {/* Card Visi - REFACTOR: bg-card & border-surface */}
      <div className="relative overflow-hidden bg-card border border-surface p-6 lg:p-8 rounded-[2rem] group transition-all duration-500 hover:border-primary/30 shadow-sm">
        <MaterialIcon
          name="visibility"
          /* REFACTOR: text-main/5 sebagai watermark agar kontras di semua tema */
          className="absolute top-4 right-4 text-[6rem] text-main/[0.05] -rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500"
        />
        {/* REFACTOR: text-primary-light */}
        <h3 className="text-xl lg:text-2xl font-bold text-primary-light mb-4 relative z-10 transition-colors duration-500">
          Visi
        </h3>
        {/* REFACTOR: text-muted */}
        <p className="text-muted text-sm lg:text-base leading-relaxed relative z-10 transition-colors duration-500">
          Menjadi platform legal-tech terdepan di Indonesia yang menjembatani
          kesenjangan akses keadilan.
        </p>
      </div>

      {/* Card Misi - REFACTOR: bg-primary/5 & border-surface */}
      <div className="relative overflow-hidden bg-primary/5 border border-surface p-6 lg:p-8 rounded-[2rem] group transition-all duration-300 hover:border-primary/30 shadow-sm">
        <MaterialIcon
          name="rocket_launch"
          /* REFACTOR: text-main/5 */
          className="absolute top-4 right-4 text-[6rem] text-main/[0.05] rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500"
        />
        {/* REFACTOR: text-primary-light */}
        <h3 className="text-xl lg:text-2xl font-bold text-primary-light mb-4 relative z-10 transition-colors duration-500">
          Misi
        </h3>
        {/* REFACTOR: text-muted */}
        <p className="text-muted text-sm lg:text-base leading-relaxed relative z-10 transition-colors duration-500">
          Memberikan konsultasi hukum instan, aman, dan transparan bagi seluruh
          lapisan masyarakat tanpa terkecuali.
        </p>
      </div>
    </div>
  );
}
