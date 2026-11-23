"use client";

import React from "react";

export default function AboutHero() {
  return (
    <div className="relative pb-4 pt-2">
      {/* 1. Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[90px] -z-10 pointer-events-none transition-colors duration-500" />

      {/* 2. Badge Vision - REFACTOR: bg-white/5 & border-white/10 -> bg-surface & border-border */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border mb-4 backdrop-blur-sm transition-all duration-500">
        <div className="w-1.5 h-1.5 rounded-full bg-primary-light" />
        <span className="text-[10px] lg:text-xs font-bold tracking-widest text-primary-light uppercase">
          Our Vision
        </span>
      </div>

      {/* 3. Heading - REFACTOR: text-white -> text-main */}
      <h1 className="text-2xl lg:text-4xl font-bold text-main leading-[1.2] tracking-tight mb-4 transition-colors duration-500">
        Mendigitalisasi <br className="hidden md:block" />
        akses hukum <span className="text-primary-light">untuk semua.</span>
      </h1>

      {/* 4. Description */}
      <p className="text-muted text-sm lg:text-base leading-relaxed max-w-xl transition-colors duration-500">
        Kami percaya setiap warga negara berhak atas bantuan hukum yang setara,
        cepat, dan terpercaya melalui teknologi.
      </p>
    </div>
  );
}
