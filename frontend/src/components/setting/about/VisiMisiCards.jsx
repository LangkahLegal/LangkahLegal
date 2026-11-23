"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";

export default function VisiMisiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Card Visi */}
      <div className="relative overflow-hidden bg-card border border-surface p-5 rounded-2xl group transition-all duration-500 hover:border-primary/30 shadow-soft">
        <MaterialIcon
          name="visibility"
          className="absolute top-4 right-4 text-[4.5rem] text-main/[0.05] -rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500"
        />
        <h3 className="text-lg font-bold text-primary-light mb-2 relative z-10 transition-colors duration-500">
          Visi
        </h3>
        <p className="text-muted text-sm leading-relaxed relative z-10 transition-colors duration-500">
          Menjadi platform legal-tech terdepan di Indonesia yang menjembatani
          kesenjangan akses keadilan.
        </p>
      </div>

      {/* Card Misi */}
      <div className="relative overflow-hidden bg-card border border-surface p-5 rounded-2xl group transition-all duration-300 hover:border-primary/30 shadow-soft">
        <MaterialIcon
          name="rocket_launch"
          className="absolute top-4 right-4 text-[4.5rem] text-main/[0.05] rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500"
        />
        <h3 className="text-lg font-bold text-primary-light mb-2 relative z-10 transition-colors duration-500">
          Misi
        </h3>
        <p className="text-muted text-sm leading-relaxed relative z-10 transition-colors duration-500">
          Memberikan konsultasi hukum instan, aman, dan transparan bagi seluruh
          lapisan masyarakat tanpa terkecuali.
        </p>
      </div>
    </div>
  );
}
