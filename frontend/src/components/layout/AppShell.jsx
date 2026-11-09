"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { useSidebarCollapsed } from "@/lib/sidebarState";

export default function AppShell({
  role = "client",
  hideBottomNav = false,
  className = "",
  contentDirection = "col",
  contentClassName = "",
  pointerPassThrough = false,
  onShellClick,
  testId,
  overlay = null,
  children,
}) {
  const { isCollapsed } = useSidebarCollapsed();
  const flexDir = contentDirection === "row" ? "flex-row" : "flex-col";

  const body = (
    <>
      {children}
      {!hideBottomNav && (
        <div className="lg:hidden">
          <BottomNav role={role} />
        </div>
      )}
    </>
  );

  return (
    <div
      onClick={onShellClick}
      data-testid={testId}
      className={`bg-bg bg-gradient-wash text-main min-h-screen flex w-full font-primary transition-colors duration-500 overflow-x-hidden ${className}`}
    >
      <Sidebar role={role} />

      {overlay}

      <div
        className={`flex-1 flex ${flexDir} relative min-w-0 ml-0 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-60"
        } transition-all duration-300 ${
          pointerPassThrough ? "pointer-events-none" : ""
        } ${contentClassName}`}
      >
        {pointerPassThrough ? (
          <div className="pointer-events-auto flex flex-col w-full min-w-0 h-full">
            {body}
          </div>
        ) : (
          body
        )}
      </div>
    </div>
  );
}

