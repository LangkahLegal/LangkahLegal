"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function ActionButtons({ onReject, onAccept }) {
  return (
    <div className="flex gap-4 pt-4">
      {/* Tombol Tolak: Menggunakan variant danger (Theme-Aware) */}
      <Button
        variant="danger"
        onClick={onReject}
        fullWidth
        className="!h-14 !rounded-2xl" // Mengunci spesifikasi ukuran kamu
      >
        <MaterialIcon name="close" className="text-xl" />
        <span>Tolak</span>
      </Button>

      {/* Tombol Terima: Menggunakan variant primary untuk aksi utama */}
      <Button
        variant="primary"
        onClick={onAccept}
        fullWidth
        className="!h-14 !rounded-2xl shadow-soft"
      >
        <MaterialIcon name="check_circle" className="text-xl" />
        <span>Terima</span>
      </Button>
    </div>
  );
}
