"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, InputField, PasswordField, GoogleIcon } from "../../../components/ui";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get("role") || "client";

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push("/dashboard");
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

            <Button type="submit">Masuk</Button>
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
