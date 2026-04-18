"use client";

import React, { useMemo } from "react";

export default function PaymentBreakdown({
  pricePerSession = 200000,
  sessionDuration = 30,
  startTime = "00:00",
  endTime = "00:00",
}) {
  // --- LOGIKA PERHITUNGAN QUANTITY ---
  const { quantity, totalMinutes } = useMemo(() => {
    if (!startTime || !endTime) return { quantity: 0, totalMinutes: 0 };

    // Pecah string jam dan menit
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    // Konversi ke total menit dari awal hari
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    // Hitung selisih
    const diff = endTotalMinutes - startTotalMinutes;

    // Jika durasi negatif (melewati tengah malam), asumsikan 0 atau tangani sesuai kebutuhan
    const finalDiff = diff > 0 ? diff : 0;

    return {
      totalMinutes: finalDiff,
      // Bagi dengan 30 menit per sesi
      quantity: finalDiff / 30,
    };
  }, [startTime, endTime]);

  const totalAmount = pricePerSession * quantity;

  // Helper untuk format rupiah
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full bg-[#151326] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
      {/* Judul Seksi */}
      <h3 className="text-white text-lg font-bold mb-6">Rincian Biaya</h3>

      {/* Baris Rincian */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[#aca8c1] text-sm sm:text-base font-medium">
            Harga Per Sesi ({sessionDuration} Menit)
          </span>
         
        </div>
        <span className="text-white text-sm sm:text-base font-bold">
          {formatCurrency(pricePerSession)} × {quantity}
        </span>
      </div>

      {/* Divider / Garis Pemisah */}
      <div className="h-px w-full bg-white/5 mb-6" />

      {/* Baris Total */}
      <div className="flex justify-between items-center">
        <span className="text-white text-lg font-bold">Total Harga</span>
        <span className="text-[#ada3ff] text-2xl font-black tracking-tight">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
