import AuthGuard from "@/components/auth/AuthGuard";

export default function KnowledgeLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
