"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function DashboardHeader({
  userName = "Pengguna",
  foto_profil,
  onSettingsClick,
  isLoading = false,
}) {
  const router = useRouter();

  // --- 2. LOGIC HANDLERS ---
  const handleSettingsClick =
    onSettingsClick || (() => router.push("/setting"));

  const safeName = userName || "User";

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full min-h-16 transition-all duration-300 px-6 py-3 lg:px-8 lg:py-3 bg-header text-on-header shadow-soft">
      {/* Group Kiri: Avatar & Identitas */}
      <div className="flex items-center gap-3.5">
        {/* User Avatar Container */}
        <div className="relative group/avatar">
          {isLoading ? (
            <Skeleton className="w-9 h-9 rounded-full !bg-header-hover" />
          ) : (
            <>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-input border-2 border-sidebar-border shadow-soft transition-all group-hover/avatar:border-on-header/60">
                <UserAvatar
                  src={foto_profil}
                  name={safeName}
                  alt={safeName}
                  size="sm"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-sidebar rounded-full shadow-sm" />
            </>
          )}
        </div>

        {/* Sapaan Teks */}
        <div className="flex flex-col gap-0.5">
          <span className="text-header-muted text-xs font-medium uppercase tracking-wider leading-none">
            Halo,
          </span>
          {isLoading ? (
            <Skeleton className="h-5 w-32 lg:w-40 !bg-header-hover" />
          ) : (
            <h2 className="text-base lg:text-lg font-headline font-bold text-on-header tracking-tight leading-tight transition-colors duration-500">
              {safeName}
            </h2>
          )}
        </div>
      </div>

      {/* Group Kanan: Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          onClick={handleSettingsClick}
          className="group text-on-header hover:bg-header-hover! transition-all"
          aria-label="Settings"
        >
          <MaterialIcon
            name="settings"
            className="text-on-header group-hover:rotate-45 transition-all duration-500 text-xl"
          />
        </Button>
      </div>
    </header>
  );
}
