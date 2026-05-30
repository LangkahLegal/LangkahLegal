import AuthGuard from "@/components/auth/AuthGuard";

export default function SettingLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
