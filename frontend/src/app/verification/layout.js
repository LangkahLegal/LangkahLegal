import AuthGuard from "@/components/auth/AuthGuard";

export default function VerificationLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
