"use client";

import React from "react";

export default function AboutHero() {
  return (
    <div className="relative pb-8 pt-4">
      {/* 1. Ambient Glow - REFACTOR: bg-[#6f59fe]/20 -> bg-primary/20 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[90px] -z-10 pointer-events-none transition-colors duration-500" />

      {/* 2. Badge Vision - REFACTOR: bg-white/5 & border-white/10 -> bg-surface & border-border */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border mb-6 backdrop-blur-sm transition-all duration-500">
        {/* REFACTOR: bg-[#ada3ff] -> bg-primary-light */}
        <div className="w-1.5 h-1.5 rounded-full bg-primary-light" />
        {/* REFACTOR: text-[#ada3ff] -> text-primary-light */}
        <span className="text-[10px] lg:text-xs font-bold tracking-widest text-primary-light uppercase">
          Our Vision
        </span>
      </div>

      {/* 3. Heading - REFACTOR: text-white -> text-main */}
      <h1 className="text-4xl lg:text-5xl font-bold text-main leading-[1.15] tracking-tight mb-6 transition-colors duration-500">
        Mendigitalisasi <br className="hidden md:block" />
        akses hukum <span className="text-primary-light">untuk semua.</span>
      </h1>

      {/* 4. Description - REFACTOR: text-[#aca8c1] -> text-muted */}
      <p className="text-muted text-base lg:text-lg leading-relaxed max-w-xl transition-colors duration-500">
        Kami percaya setiap warga negara berhak atas bantuan hukum yang setara,
        cepat, dan terpercaya melalui teknologi.
      </p>
    </div>
  );
}
