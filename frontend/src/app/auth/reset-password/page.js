"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

import ResetPasswordHeader from "@/components/auth/reset-password/ResetPasswordHeader";
import ResetPasswordForm from "@/components/auth/reset-password/ResetPasswordForm";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleResetPassword = async (formData) => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setErrorMsg("Semua kolom wajib diisi.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg("Password dan konfirmasi password tidak cocok.");
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await authService.resetPassword({
        newPassword: formData.newPassword,
      });
      
      // Karena backend memutus sesi (logout) demi keamanan setelah reset password,
      // kita arahkan pengguna ke halaman login.
      alert("Password berhasil diubah! Silakan login dengan password baru Anda.");
      router.replace("/auth/login");
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mengatur ulang password. Sesi mungkin kadaluarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-6 py-8 bg-bg text-main overflow-hidden transition-colors duration-500">
      <main className="relative z-10 w-full max-w-[400px] mx-auto">
        <ResetPasswordHeader />

        <section>
          <ResetPasswordForm
            onSubmit={handleResetPassword}
            isLoading={isLoading}
            errorMsg={errorMsg}
          />
        </section>
      </main>
    </div>
  );
}
