"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui";
import { PasswordField } from "@/components/ui/PasswordField";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsLoading(true);
    // Simulasi API call
    setTimeout(() => {
      setIsLoading(false);
      alert("Kata sandi berhasil diperbarui!");
      router.back();
    }, 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main | font-primary */
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Keamanan & Sandi" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="space-y-3">
              {/* REFACTOR: text-white -> text-main */}
              <h2 className="text-3xl font-extrabold text-main tracking-tight transition-colors duration-500">
                Ubah Kata Sandi
              </h2>
              {/* REFACTOR: text-[#aca8c1] -> text-muted */}
              <p className="text-sm leading-relaxed text-muted">
                Pastikan kata sandi Anda kuat dan unik untuk menjaga keamanan
                akun Anda.
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <PasswordField
                  label="Kata Sandi Saat Ini"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />

                <PasswordField
                  label="Kata Sandi Baru"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Min. 8 karakter"
                  required
                  minLength={8}
                />

                <PasswordField
                  label="Konfirmasi Kata Sandi Baru"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Ulangi kata sandi baru"
                  required
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  fullWidth
                  type="submit"
                  isLoading={isLoading}
                  /* REFACTOR: Shadow menggunakan shadow-primary/20 agar adaptif */
                  className="py-6 rounded-2xl shadow-lg shadow-primary/20 font-bold"
                >
                  Simpan Kata Sandi
                </Button>
              </div>
            </form>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
