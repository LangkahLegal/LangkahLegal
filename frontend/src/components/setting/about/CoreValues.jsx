"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";

const CORE_VALUES = [
  {
    title: "Integritas",
    desc: "Menjaga standar etika profesi hukum tertinggi.",
    icon: "local_police",
  },
  {
    title: "Transparansi",
    desc: "Biaya dan proses yang jelas sejak awal.",
    icon: "receipt_long",
  },
  {
    title: "Aksesibilitas",
    desc: "Layanan hukum profesional yang terjangkau.",
    icon: "payments",
  },
];

export default function CoreValues() {
  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-bold text-main transition-colors duration-500">
        Nilai Utama Kami
      </h2>

      <div className="flex flex-col gap-3">
        {CORE_VALUES.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 bg-card border border-surface p-4 rounded-2xl hover:bg-surface/50 transition-all duration-300 shadow-sm"
          >
            <div className="w-11 h-11 shrink-0 rounded-xl bg-input border border-surface flex items-center justify-center transition-colors duration-500">
              <MaterialIcon
                name={item.icon}
                className="text-primary-light text-xl transition-colors duration-500"
              />
            </div>

            <div>
              <h4 className="font-bold text-main text-sm lg:text-base mb-0.5 transition-colors duration-500">
                {item.title}
              </h4>
              <p className="text-muted text-xs leading-relaxed transition-colors duration-500">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
