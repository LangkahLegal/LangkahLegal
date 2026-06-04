import AuthGuard from "@/components/auth/AuthGuard";

export default function ConsultationLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
