"use client";

import { BrandLogo, MaterialIcon } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { useSidebarCollapsed } from "@/lib/sidebarState";

export default function Sidebar({ role = "client" }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isCollapsed, toggle } = useSidebarCollapsed();

  const isLight = theme === "theme-white-modern";
  const isSettingActive = pathname.startsWith("/setting");

  const NAV_ITEMS =
    role === "konsultan"
      ? [
          { label: "Klien", icon: "group", path: "/consultation" },
          { label: "Bursa", icon: "storefront", path: "/bursa" },
          { label: "Riwayat", icon: "history", path: "/history/consultant" },
          { label: "Jadwal", icon: "calendar_today", path: "/schedule" },
        ]
      : role === "admin"
        ? [
            {
              label: "Verifikasi",
              icon: "verified_user",
              path: "/verification",
            },
            { label: "Knowledge", icon: "menu_book", path: "/knowledge" },
          ]
        : [
            { label: "Konsultasi", icon: "gavel", path: "/explore" },
            { label: "Bursa", icon: "storefront", path: "/bursa/post" },
            { label: "Tanya AI", icon: "psychology", path: "/ai" },
            { label: "Riwayat", icon: "history", path: "/history/client" },
          ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 hidden lg:flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20 px-3 pb-5 items-center" : "w-60 px-4 pb-5"
      }`}
    >
      {/* Top Bar: Sidebar Toggle + Brand Logo */}
      {isCollapsed ? (
        <div className="flex flex-col items-center w-full mb-4">
          <div className="flex items-center justify-center w-full h-16 shrink-0">
            <BrandLogo
              variant="sidebar"
              showText={false}
              iconSize="w-7 h-7"
            />
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label="Buka sidebar"
            title="Buka sidebar"
            className="flex items-center justify-center w-11 h-11 rounded-xl text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors shrink-0"
          >
            <MaterialIcon name="left_panel_open" className="text-[22px]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center w-full h-16 shrink-0 mb-4 gap-1.5">
          <button
            type="button"
            onClick={toggle}
            aria-label="Tutup sidebar"
            title="Tutup sidebar"
            className="flex items-center justify-center w-11 h-11 rounded-xl text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors shrink-0 ml-[3px]"
          >
            <MaterialIcon name="left_panel_close" className="text-[22px]" />
          </button>

          <BrandLogo
            variant="sidebar"
            iconSize="w-7 h-7"
            textSize="text-base"
          />
        </div>
      )}

      {/* Navigation Menu */}
      <nav className={`flex-1 w-full ${isCollapsed ? "space-y-1.5" : "space-y-1"}`}>
        {!isCollapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-muted/70 px-3 mb-2">
            Menu
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              title={item.label}
              aria-label={item.label}
              className={`flex items-center rounded-xl border-l-2 transition-all duration-200 group ${
                isCollapsed
                  ? "justify-center w-11 h-11 mx-auto px-0"
                  : "gap-3 px-3 py-2.5"
              } ${
                isActive
                  ? "bg-sidebar-active text-sidebar-active-text border-secondary"
                  : "border-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
              }`}
            >
              <MaterialIcon
                name={item.icon}
                className={`text-[22px] shrink-0 transition-colors ${
                  isActive
                    ? "text-sidebar-active-text"
                    : "text-sidebar-muted group-hover:text-sidebar-text"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              />
              {!isCollapsed && (
                <span className="text-sm font-semibold truncate transition-colors">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Utilities: Theme & Settings */}
      <div className="mt-auto pt-4 border-t border-sidebar-border w-full space-y-1">
        <button
          type="button"
          onClick={() =>
            setTheme(isLight ? "dark-tech" : "theme-white-modern")
          }
          aria-label="Ganti tema tampilan"
          title={isLight ? "Ubah ke mode gelap" : "Ubah ke mode terang"}
          className={`flex items-center w-full rounded-xl border-l-2 border-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text transition-colors group ${
            isCollapsed
              ? "justify-center w-11 h-11 mx-auto px-0"
              : "gap-3 px-3 py-2.5"
          }`}
        >
          <MaterialIcon
            name={isLight ? "dark_mode" : "light_mode"}
            className="text-xl shrink-0"
          />
          {!isCollapsed && (
            <span className="text-sm font-medium truncate">
              {isLight ? "Mode Gelap" : "Mode Terang"}
            </span>
          )}
        </button>

        <Link
          href="/setting"
          aria-label="Pengaturan"
          title="Pengaturan"
          className={`flex items-center w-full rounded-xl border-l-2 transition-colors group ${
            isCollapsed
              ? "justify-center w-11 h-11 mx-auto px-0"
              : "gap-3 px-3 py-2.5"
          } ${
            isSettingActive
              ? "bg-sidebar-active text-sidebar-active-text border-secondary"
              : "border-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text"
          }`}
        >
          <MaterialIcon
            name="settings"
            className={`text-xl shrink-0 ${
              isSettingActive
                ? "text-sidebar-active-text"
                : "text-sidebar-muted group-hover:text-sidebar-text"
            }`}
          />
          {!isCollapsed && (
            <span className="text-sm font-medium truncate">Pengaturan</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
