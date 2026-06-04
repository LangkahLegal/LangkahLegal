import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth requireRole redirectToRoleHome>
      {children}
    </AuthGuard>
  );
}
