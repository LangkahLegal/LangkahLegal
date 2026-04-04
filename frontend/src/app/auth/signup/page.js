"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, InputField, PasswordField, GoogleIcon } from "../../../components/ui";

export default function SignupClientPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const router = useRouter();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push("/auth/verify");
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
          <h1 className="auth-title text-4xl">Buat Akun Baru</h1>
          <p className="text-[#aca8c1] text-base px-4">
            Daftar sekarang untuk mulai mengelola dokumen hukum Anda dengan mudah.
          </p>
        </header>

        <section className="space-y-6">
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

            <Button type="submit" className="mt-4 w-full">
              Daftar
            </Button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Atau daftar dengan</span>
            <div className="auth-divider-line" />
          </div>

          <button className="btn-social">
            <GoogleIcon />
            Daftar dengan Google
          </button>
        </section>

        <footer className="text-center pt-4">
          <p className="text-[#aca8c1] text-sm font-medium">
            Sudah memiliki akun?{" "}
            <Link href="/auth/login" className="link-accent ml-1">Masuk Sekarang</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}