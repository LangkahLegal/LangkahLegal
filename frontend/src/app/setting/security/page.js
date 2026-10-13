"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { authService } from "@/services/auth.service";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui";
import { PasswordField } from "@/components/ui/PasswordField";
import { clearAuthSession, isPasswordSession } from "@/lib/authStorage";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordRules";
import { useClientValue } from "@/lib/useClientValue";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Pengguna yang masuk lewat Google belum punya kata sandi, jadi tidak diminta kata sandi lama.
  const needsCurrentPassword = useClientValue(isPasswordSession, false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < MIN_PASSWORD_LENGTH) {
      alert(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        newPassword: formData.newPassword,
        currentPassword: needsCurrentPassword ? formData.currentPassword : undefined,
      });
      alert("Kata sandi berhasil diperbarui! Silakan login kembali dengan sandi baru Anda.");
      clearAuthSession();
      router.replace("/auth/login");
    } catch (err) {
      alert(err?.message || "Gagal memperbarui kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Keamanan & Sandi" />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-main tracking-tight transition-colors duration-500">
                Ubah Kata Sandi
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                Pastikan kata sandi Anda kuat dan unik untuk menjaga keamanan
                akun Anda.
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {needsCurrentPassword && (
                  <PasswordField
                    label="Kata Sandi Saat Ini"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Masukkan kata sandi saat ini"
                    required
                  />
                )}

                <PasswordField
                  label="Kata Sandi Baru"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder={`Min. ${MIN_PASSWORD_LENGTH} karakter`}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
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
