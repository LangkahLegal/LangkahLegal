"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredRole,
} from "@/lib/authStorage";

const ROLE_HOME = {
  admin: "/dashboard/admin",
  konsultan: "/dashboard/consultant",
  consultant: "/dashboard/consultant",
  client: "/dashboard/client",
};

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === "consultant") return "konsultan";
  if (normalized === "konsultan") return "konsultan";
  if (normalized === "admin") return "admin";
  if (normalized === "client") return "client";
  return null;
};

const readSessionSnapshot = () => {
  if (typeof window === "undefined") {
    return {
      hasSession: false,
      role: null,
      isReady: false,
    };
  }

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const storedRole = normalizeRole(getStoredRole());

  return {
    hasSession: Boolean(accessToken || refreshToken),
    role: storedRole,
    isReady: true,
  };
};

export default function AuthGuard({
  children,
  requireAuth = true,
  requireRole = false,
  redirectToRoleHome = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sessionSnapshot = useMemo(() => readSessionSnapshot(), []);

  const { hasSession, role, isReady } = sessionSnapshot;

  useEffect(() => {
    if (!isReady) return;

    if (!hasSession) {
      if (!requireAuth) return;
      router.replace("/auth/login");
      return;
    }

    if (requireRole && !role && pathname !== "/auth/role") {
      router.replace("/auth/role");
      return;
    }

    if (!requireRole || !role || !redirectToRoleHome) return;

    const target = ROLE_HOME[role];
    if (target && !pathname.startsWith(target)) {
      router.replace(target);
    }
  }, [
    hasSession,
    isReady,
    requireAuth,
    pathname,
    requireRole,
    redirectToRoleHome,
    role,
    router,
  ]);

  const content = useMemo(() => {
    if (!isReady || (requireAuth && !hasSession && pathname !== "/auth/role")) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg text-main">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted">
              Menyiapkan sesi...
            </p>
          </div>
        </div>
      );
    }

    return children;
  }, [children, hasSession, isReady, pathname, requireAuth]);

  return content;
}
