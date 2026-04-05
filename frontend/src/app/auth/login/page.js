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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await authService.login(formData.email, formData.password);

      if (result.success) {
        // LOGIKA REDIRECT BERDASARKAN ROLE
        if (result.role === "konsultan") {
          router.push("/dashboard/consultan");
        } else {
          router.push("/dashboard/client");
        }

        // Refresh router agar komponen layout (Sidebar/Header) sadar user sudah login
        router.refresh();
      }
    } catch (err) {
      // Tangkap pesan error dari FastAPI detail
      const message =
        err.response?.data?.detail || "Email atau password salah.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="glow-top-left" />
      <div className="glow-bottom-right" />

      <main className="auth-container">
        <header className="mb-10 text-center md:text-left">
          <h1 className="auth-title">Selamat Datang Kembali</h1>
          <p className="auth-subtitle">
            Masuk untuk melanjutkan konsultasi hukum Anda.
          </p>
        </header>

        <section className="space-y-5">
          {/* Tampilkan Pesan Error */}
          {errorMsg && (
            <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="nama@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="flex justify-end -mb-2">
              <Link
                href="/auth/forgot-password"
                className="link-primary text-sm hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            <PasswordField
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
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

          <Button variant="social" type="button" className="w-full">
            <GoogleIcon />
            Masuk dengan Google
          </Button>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-[#aca8c1] font-medium">
            Belum punya akun?{" "}
            <Link href="/auth/signup" className="link-primary ml-1">
              Daftar
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
