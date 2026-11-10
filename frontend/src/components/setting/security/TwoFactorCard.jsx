"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

export default function TwoFactorCard() {
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div className="bg-card p-6 rounded-2xl border border-surface flex justify-between items-center shadow-soft">
      <div>
        <p className="font-semibold text-main">Autentikasi 2 Faktor</p>
        <p className="text-sm text-muted">
          Tambahkan lapisan keamanan ekstra pada akun Anda.
        </p>
      </div>

      <Toggle enabled={twoFA} onChange={setTwoFA} />
    </div>
  );
}