"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { usePathname, useRouter } from "next/navigation";
import { getStoredRole } from "@/lib/authStorage";

export default function PageHeader({
  title,
  backHref,
  onSettingsClick,
  variant = "app",
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isSettingArea = pathname.toLowerCase().includes("/setting");
  const isConsultantPage = pathname
    .toLowerCase()
    .includes("/dashboard/consultant");

  const getRoleFallback = () => {
    const role = getStoredRole() || "client";
    if (
      role.toLowerCase().includes("konsultan") ||
      role.toLowerCase().includes("consultant")
    )
      return "/dashboard/consultant";
    if (role.toLowerCase() === "admin") return "/dashboard/admin";
    return "/dashboard/client";
  };

  let dynamicBack = isConsultantPage
    ? "/dashboard/consultant"
    : getRoleFallback();

  if (isSettingArea && pathname !== "/setting" && pathname !== "/settings") {
    dynamicBack = "/setting";
  }

  const handleBackClick = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    // Halaman dianggap sub-halaman jika memiliki kedalaman > 1 segment,
    // bukan dashboard, dan bukan halaman utama khusus role (yang berakhiran 'client', 'consultant', atau 'post')
    const isRolePage = ["client", "consultant", "post"].includes(lastSegment);
    const isSubPage =
      segments.length > 1 && !pathname.includes("/dashboard") && !isRolePage;

    if (
      isSubPage &&
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.push(dynamicBack);
    }
  };

  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  const isAppHeader = variant !== "plain";

  return (
    <header
      className={`sticky top-0 z-40 w-full min-h-16 flex items-center px-6 py-3 lg:px-8 lg:py-3 transition-all duration-300 ${
        isAppHeader
          ? "bg-header text-on-header shadow-soft"
          : "bg-bg/80 backdrop-blur-md border-b border-surface"
      }`}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3.5">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className={`!p-0 !w-9 !h-9 !rounded-xl group/back border border-transparent ${
              isAppHeader
                ? "text-on-header hover:bg-header-hover! hover:text-on-header!"
                : "hover:border-primary/30 hover:bg-primary/10!"
            }`}
          >
            <MaterialIcon
              name="west"
              className={`group-hover/back:-translate-x-1 transition-all text-xl ${
                isAppHeader
                  ? "text-on-header"
                  : "text-muted group-hover/back:text-primary"
              }`}
            />
          </Button>

          <h1
            className={`text-lg lg:text-xl font-bold tracking-tight font-headline ${
              isAppHeader ? "text-on-header" : "text-main"
            }`}
          >
            {title}
          </h1>
        </div>

        {/* AKSI KANAN: Sembunyikan jika sudah berada di area setting */}
        {!isSettingArea ? (
          <Button
            variant="icon"
            onClick={handleSettingsClick}
            className={`group ${isAppHeader ? "text-on-header hover:bg-header-hover!" : ""}`}
          >
            <MaterialIcon
              name="settings"
              className={`group-hover:rotate-45 transition-all duration-500 text-xl ${
                isAppHeader
                  ? "text-on-header"
                  : "text-muted group-hover:text-main"
              }`}
            />
          </Button>
        ) : (
          // Menyamakan ukuran div placeholder dengan tombol Back yang baru
          <div className="w-9 h-9" />
        )}
      </div>
    </header>
  );
}
