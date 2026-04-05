"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, InputField, PasswordField, GoogleIcon } from "../../../components/ui";
import { authService } from "../../../services/auth";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get("role") || "client";

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); 

    try {
      const data = await authService.login(formData.email, formData.password);

      // Simpan token JWT ke localStorage browser
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", currentRole); 

      router.push("/dashboard/client");

    } catch (error) {
      setErrorMessage(error.message);
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
          {errorMessage && (
            <div className="bg-[#ff6e84]/10 border border-[#ff6e84] text-[#ffb2b9] px-4 py-3 rounded-xl text-sm text-center">
              {errorMessage}
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

            <PasswordField
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="link-primary text-sm"
              >
                Lupa password?
              </Link>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Atau masuk dengan</span>
            <div className="auth-divider-line" />
          </div>

          <Button variant="social" type="button">
            <GoogleIcon />
            Masuk dengan Google
          </Button>
        </section>

        <footer className="mt-12 text-center">
          <p className="text-[#aca8c1] font-medium">
            Belum punya akun?{" "}
            <Link href={`/auth/signup?role=${currentRole}`} className="link-primary ml-1">
              Daftar
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}