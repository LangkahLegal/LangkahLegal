import AuthGuard from "@/components/auth/AuthGuard";

export default function RequestLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
