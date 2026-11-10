"use client";

import { Toggle } from "@/components/ui/Toggle";

export default function AvailabilityToggle({
  isAvailable = false, // Safety: default ke false jika undefined
  onChange = () => {}, // Safety: fallback ke fungsi kosong
}) {
  return (
    <section data-testid="availability-toggle-section">

      <div className="bg-card rounded-2xl p-4 sm:p-5 flex items-center justify-between border border-surface shadow-soft transition-all duration-500">
        <div className="flex flex-col">
          <h3 className="text-base font-bold text-main transition-colors duration-500">
            Status Konsultasi
          </h3>

          <p className="text-xs text-muted transition-colors duration-500">
            {isAvailable
              ? "Aktif Menerima Konsultasi"
              : "Tidak Menerima Konsultasi"}
          </p>
        </div>

        {/* Toggle switch */}
        <div>
          <Toggle enabled={isAvailable ?? false} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}
