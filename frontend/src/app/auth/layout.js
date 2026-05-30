import AuthGuard from "@/components/auth/AuthGuard";

export default function AuthLayout({ children }) {
  return (
    <AuthGuard requireAuth={false} redirectToRoleHome>
      {children}
    </AuthGuard>
  );
}
