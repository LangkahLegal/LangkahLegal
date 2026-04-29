"use client";

import { Toggle } from "@/components/ui/Toggle";

export default function AvailabilityToggle({
  isAvailable = false, // Safety: default ke false jika undefined
  onChange = () => {}, // Safety: fallback ke fungsi kosong
}) {
  return (
    <section>

      <div className="bg-card rounded-[2rem] p-6 flex items-center justify-between border border-surface shadow-2xl transition-all duration-500">
        <div className="flex flex-col">
          {/* REFACTOR: text-white -> text-main */}
          <h3 className="text-lg font-bold text-main transition-colors duration-500">
            Status Konsultasi
          </h3>

          {/* REFACTOR: text-[#aca8c1] -> text-muted */}
          <p className="text-xs text-muted transition-colors duration-500">
            {isAvailable
              ? "Aktif Menerima Konsultasi"
              : "Tidak Menerima Konsultasi"}
          </p>
        </div>

        {/* Toggle switch */}
        <div className="scale-110">
          <Toggle enabled={isAvailable ?? false} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}
