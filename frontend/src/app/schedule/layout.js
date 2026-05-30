import AuthGuard from "@/components/auth/AuthGuard";

export default function ScheduleLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
