"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service"; // Import service
import {
  Button,
  InputField,
  PasswordField,
  GoogleIcon,
} from "../../../components/ui";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      setErrorMsg("Password wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const session = await authService.loginWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (!session) {
        setErrorMsg("Email atau password salah.");
        return;
      }

      const profile = await authService.getProfile();
      const role = profile?.role;

      if (!role) {
        router.push("/auth/role");
        return;
      }

      router.push(
        role === "konsultan" ? "/dashboard/consultant" : "/dashboard/client",
      );
      router.refresh();
    } catch (err) {
      const message = err?.message || "Gagal login. Coba lagi.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      await authService.signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (err) {
      const message = err?.message || "Gagal login dengan Google.";
      setErrorMsg(message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="glow-top-left" />
      <div className="glow-bottom-right" />

      <main className="auth-container">
        <header className="mb-10 text-center md:text-left">
          <h1 className="auth-title">Selamat Datang</h1>
          <p className="auth-subtitle">
            Masuk untuk melakukan konsultasi hukum Anda.
          </p>
        </header>

        <section className="space-y-5">
          {/* Tampilkan Pesan Error */}
          {errorMsg && (
            <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="nama@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <PasswordField
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />

            <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
              {isLoading ? "Memverifikasi..." : "Masuk"}
            </Button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Atau masuk dengan</span>
            <div className="auth-divider-line" />
          </div>

          <Button
            variant="social"
            type="button"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            Masuk dengan Google
          </Button>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-[#aca8c1] font-medium">
            Belum punya akun?{" "}
            <Link href="/auth/role" className="link-primary ml-1">
              Daftar
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
