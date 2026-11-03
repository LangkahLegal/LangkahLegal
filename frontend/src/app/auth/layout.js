import AuthGuard from "@/components/auth/AuthGuard";

const GUEST_ONLY_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/role",
  "/role",
];

export default function AuthLayout({ children }) {
  return (
    <AuthGuard requireAuth={false} redirectToRoleHome guestOnlyPaths={GUEST_ONLY_PATHS}>
      {children}
    </AuthGuard>
  );
}
