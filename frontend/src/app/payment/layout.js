import AuthGuard from "@/components/auth/AuthGuard";

export default function PaymentLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
