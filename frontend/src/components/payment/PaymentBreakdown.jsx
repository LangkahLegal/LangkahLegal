"use client";

import React from "react";

export default function PaymentBreakdown({
  pricePerSession = 200000,
  sessionDuration = 30,
  quantity = 1,
  totalAmount = 200000,
}) {
  // Helper untuk format rupiah (Safety check untuk mencegah NaN/undefined)
  const formatCurrency = (amount) => {
    const safeAmount = amount ?? 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(safeAmount);
  };

  return (
    <div className="w-full bg-card rounded-[2rem] p-8 border border-surface shadow-2xl transition-all duration-500">
      {/* Judul Seksi - REFACTOR: text-white -> text-main */}
      <h3 className="text-main text-lg font-bold mb-6 transition-colors">
        Rincian Biaya
      </h3>

      {/* Baris Rincian */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-muted text-sm sm:text-base font-medium transition-colors">
            Harga Per Sesi ({sessionDuration} Menit)
          </span>
        </div>
        <span className="text-main text-sm sm:text-base font-bold transition-colors">
          {formatCurrency(pricePerSession)} × {quantity}
        </span>
      </div>

      {/* Divider / Garis Pemisah - REFACTOR: bg-white/5 -> bg-surface */}
      <div className="h-px w-full bg-surface mb-6 transition-colors" />

      {/* Baris Total */}
      <div className="flex justify-between items-center">
        <span className="text-main text-lg font-bold transition-colors">
          Total Harga
        </span>
        <span className="text-primary-light text-2xl font-black tracking-tight transition-colors">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
