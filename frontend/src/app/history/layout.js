import AuthGuard from "@/components/auth/AuthGuard";

export default function HistoryLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
