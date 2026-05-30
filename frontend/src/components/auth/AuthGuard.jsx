"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function AuthGuard({
  children,
  requireRole = false,
  redirectToRoleHome = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const accessToken = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();
    const storedRole = normalizeRole(getStoredRole());

    setHasSession(Boolean(accessToken || refreshToken));
    setRole(storedRole);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!hasSession) {
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
    pathname,
    requireRole,
    redirectToRoleHome,
    role,
    router,
  ]);

  const content = useMemo(() => {
    if (!isReady || (!hasSession && pathname !== "/auth/role")) {
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
  }, [children, hasSession, isReady, pathname]);

  return content;
}
