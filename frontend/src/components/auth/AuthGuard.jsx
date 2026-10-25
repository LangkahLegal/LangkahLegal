"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredRole,
} from "@/lib/authStorage";
import { useClientValue } from "@/lib/useClientValue";

const ROLE_HOME = {
  admin: "/dashboard/admin",
  konsultan: "/dashboard/consultant",
  consultant: "/dashboard/consultant",
  client: "/dashboard/client",
};

// Halaman yang hanya boleh dibuka peran tertentu. Aturan paling spesifik ditulis lebih dulu.
// `exact` berarti hanya alamat itu sendiri, bukan sub-halamannya.
const ROUTE_ROLES = [
  { path: "/dashboard/client", roles: ["client"] },
  { path: "/dashboard/consultant", roles: ["konsultan"] },
  { path: "/dashboard/admin", roles: ["admin"] },
  { path: "/bursa/post", roles: ["client"] },
  { path: "/bursa", roles: ["konsultan"] },
  { path: "/schedule", roles: ["konsultan"] },
  { path: "/request", roles: ["konsultan"] },
  { path: "/consultation", roles: ["konsultan"], exact: true },
  { path: "/history/client", roles: ["client"] },
  { path: "/history/consultant", roles: ["konsultan"] },
  { path: "/payment", roles: ["client"] },
  { path: "/verification", roles: ["admin"] },
  { path: "/knowledge", roles: ["admin"] },
];

const normalizeRole = (role) => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === "consultant") return "konsultan";
  if (normalized === "konsultan") return "konsultan";
  if (normalized === "admin") return "admin";
  if (normalized === "client") return "client";
  return null;
};

const allowedRolesFor = (pathname) => {
  const rule = ROUTE_ROLES.find(({ path, exact }) =>
    exact
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`),
  );
  return rule ? rule.roles : null;
};

const readHasSession = () =>
  Boolean(getStoredAccessToken() || getStoredRefreshToken());

const readRole = () => normalizeRole(getStoredRole());

const readIsReady = () => true;

export default function AuthGuard({
  children,
  requireAuth = true,
  requireRole = false,
  redirectToRoleHome = false,
  guestOnlyPaths = [],
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Sesi hanya ada di browser; server selalu merender keadaan "belum siap".
  const isReady = useClientValue(readIsReady, false);
  const hasSession = useClientValue(readHasSession, false);
  const role = useClientValue(readRole, null);

  const isRolePage = pathname === "/auth/role" || pathname === "/role";
  const allowedRoles = allowedRolesFor(pathname);
  const isWrongRole = Boolean(role && allowedRoles && !allowedRoles.includes(role));
  const isGuestOnly = Boolean(role && guestOnlyPaths.includes(pathname));
  const mustLeave = hasSession && (isWrongRole || isGuestOnly);

  useEffect(() => {
    if (!isReady) return;

    if (!hasSession) {
      if (!requireAuth) return;
      router.replace("/auth/login");
      return;
    }

    if (mustLeave) {
      const target = ROLE_HOME[role];
      if (target && !pathname.startsWith(target)) {
        router.replace(target);
      }
      return;
    }

    if (requireRole && !role && !isRolePage) {
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
    mustLeave,
    requireAuth,
    pathname,
    requireRole,
    redirectToRoleHome,
    role,
    router,
    isRolePage,
  ]);

  const content = useMemo(() => {
    const isWaitingForLogin =
      requireAuth && !hasSession && !isRolePage;

    if (!isReady || isWaitingForLogin || mustLeave) {
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
  }, [children, hasSession, isReady, mustLeave, isRolePage, requireAuth]);

  return content;
}
