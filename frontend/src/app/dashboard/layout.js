import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requireRole redirectToRoleHome>
      {children}
    </AuthGuard>
  );
}
