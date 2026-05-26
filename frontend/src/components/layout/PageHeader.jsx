"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { usePathname, useRouter } from "next/navigation";

export default function PageHeader({ title, backHref, onSettingsClick }) {
  const pathname = usePathname();
  const router = useRouter();

  // DETEKSI AREA: Logic untuk menentukan kemana tombol "Back" mengarah
  const isSettingArea = pathname.toLowerCase().includes("/setting");
  const isConsultantPage = pathname
    .toLowerCase()
    .includes("/dashboard/consultant");

  let dynamicBack = isConsultantPage
    ? "/dashboard/consultant"
    : "/dashboard/client";

  if (isSettingArea && pathname !== "/setting" && pathname !== "/settings") {
    dynamicBack = "/setting";
  }

  const finalBackHref = backHref || dynamicBack;

  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/80 backdrop-blur-md border-b border-surface px-6 py-5 lg:px-12 transition-all duration-300">
      <div className="flex justify-between items-center max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          {/* TOMBOL BACK: Menggunakan Button variant ghost agar transparan tapi tetap punya interaksi scale */}
          <Button
            variant="ghost"
            onClick={() => router.push(finalBackHref)}
            className="!p-0 !w-10 !h-10 lg:!w-12 lg:!h-12 !rounded-xl group/back border border-transparent hover:border-primary/30 hover:bg-primary/10"
          >
            <MaterialIcon
              name="west"
              className="text-muted group-hover/back:text-primary group-hover/back:-translate-x-1 transition-all text-2xl lg:text-3xl"
            />
          </Button>

          <h1 className="text-xl lg:text-2xl font-bold text-main tracking-tight font-headline">
            {title}
          </h1>
        </div>

        {/* AKSI KANAN: Sembunyikan jika sudah berada di area setting */}
        {!isSettingArea ? (
          <Button
            variant="icon"
            onClick={handleSettingsClick}
            className="group"
          >
            <MaterialIcon
              name="settings"
              className="text-muted group-hover:text-main group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
            />
          </Button>
        ) : (
          <div className="w-10 h-10 lg:w-12 lg:h-12" />
        )}
      </div>
    </header>
  );
}
