import AuthGuard from "@/components/auth/AuthGuard";

export default function BursaLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
