"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  InputField,
  PasswordField,
  GoogleIcon,
} from "../../../components/ui";
import { authService } from "@/services/auth.service";

export default function SignupClientPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const pendingRole = sessionStorage.getItem("pending_role");
    if (!pendingRole) {
      router.replace("/auth/role");
      return;
    }
    setSelectedRole(pendingRole);
  }, [router]);

  // Logika Konten Header Dinamis
  const isConsultant = selectedRole === "konsultan";
  const headerTitle = isConsultant
    ? "Daftar sebagai Konsultan"
    : "Daftar sebagai Client";
  const headerSubtitle = isConsultant
    ? "Bergabunglah dengan jaringan pakar hukum kami dan mulai berikan konsultasi profesional."
    : "Daftar sekarang dan cari konsultan hukum terbaik untuk kebutuhan Anda.";

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (!selectedRole) {
        setErrorMsg("Silakan pilih role terlebih dahulu.");
        return;
      }

      await authService.signUpWithPassword({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: selectedRole,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      });

      sessionStorage.setItem(
        "pending_auth",
        JSON.stringify({
          email: formData.email,
          role: selectedRole,
          flow: "signup",
        }),
      );
      sessionStorage.removeItem("pending_role");

      router.push("/auth/verify");
    } catch (err) {
      const message = err?.message || "Gagal mengirim OTP. Coba lagi.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      if (selectedRole) {
        sessionStorage.setItem(
          "pending_auth",
          JSON.stringify({
            role: selectedRole,
            flow: "oauth_signup",
          }),
        );
      }
      await authService.signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal login dengan Google.");
    }
  };

  return (
    <div className="auth-screen">
      <div className="glow-top-left" />
      <div className="glow-bottom-right" />

      {/* Side decoration (desktop only) */}
      <div className="hidden lg:block fixed -right-20 top-1/4 w-80 h-80 opacity-20 rotate-12 pointer-events-none">
        <div className="w-full h-full rounded-[4rem] border-[40px] border-[#9e93ff] blur-sm" />
      </div>

      <main className="auth-container space-y-8">
        <header className="text-center space-y-3">
          <h1 className="auth-title text-4xl">{headerTitle}</h1>
          <p className="text-[#aca8c1] text-base px-4">{headerSubtitle}</p>
        </header>

        <section className="space-y-6">
          {errorMsg && (
            <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Nama Lengkap"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="example@langkahlegal.id"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <PasswordField
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
              {isLoading ? "Mengirim OTP..." : "Daftar"}
            </Button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Atau daftar dengan</span>
            <div className="auth-divider-line" />
          </div>

          <button
            type="button"
            className="btn-social w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignup}
          >
            <GoogleIcon />
            Daftar dengan Google
          </button>
        </section>

        <footer className="text-center pt-4">
          <p className="text-[#aca8c1] text-sm font-medium">
            Sudah memiliki akun?{" "}
            <Link href="/auth/login" className="link-accent ml-1">
              Masuk Sekarang
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
