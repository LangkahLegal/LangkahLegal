"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

export default function TwoFactorCard() {
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex justify-between items-center">
      <div>
        <p className="font-semibold text-[#e8e2fc]">Autentikasi 2 Faktor</p>
        <p className="text-sm text-[#aca8c1]">
          Tambahkan lapisan keamanan ekstra pada akun Anda.
        </p>
      </div>

      <Toggle enabled={twoFA} onChange={setTwoFA} />
    </div>
  );
}