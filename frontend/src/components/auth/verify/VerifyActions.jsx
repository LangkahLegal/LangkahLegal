"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export default function VerifyActions({
  onSubmit,
  onResend,
  isLoading,
  isDisableSubmit,
}) {
  return (
    <div className="w-full space-y-6">
      {/* Tombol Utama: Menggunakan DNA Button Primary */}
      <Button
        variant="primary"
        fullWidth
        onClick={onSubmit}
        isLoading={isLoading}
        disabled={isDisableSubmit}
        className="!py-4 shadow-soft"
      >
        Verifikasi
      </Button>

      {/* Group Kirim Ulang */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-muted text-sm font-medium">Tidak menerima kode?</p>

        {/* Menggunakan Button variant ghost agar tetap clean seperti link 
            tapi punya feedback saat diklik (scale effect) */}
        <Button
          variant="ghost"
          onClick={onResend}
          className="!p-0 !h-auto !bg-transparent !text-primary-light hover:!text-primary font-bold text-sm tracking-wide"
        >
          Kirim Ulang
        </Button>
      </div>
    </div>
  );
}
