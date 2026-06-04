"use client";

import { useState } from "react";
import { authService } from "@/services/auth.service";
import { getAppOrigin } from "@/lib/appOrigin";

import ForgotPasswordHeader from "@/components/auth/forgot-password/ForgotPasswordHeader";
import ForgotPasswordForm from "@/components/auth/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleForgotPassword = async (email) => {
    if (!email) {
      setErrorMsg("Email wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await authService.forgotPassword({
        email,
        emailRedirectTo: `${getAppOrigin()}/auth/callback?next=/auth/reset-password`,
      });
      setIsSuccess(true);
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mengirim link reset password. Pastikan email terdaftar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-6 py-8 bg-bg text-main overflow-hidden transition-colors duration-500">
      <main className="relative z-10 w-full max-w-[400px] mx-auto">
        <ForgotPasswordHeader />

        <section>
          <ForgotPasswordForm
            onSubmit={handleForgotPassword}
            isLoading={isLoading}
            errorMsg={errorMsg}
            isSuccess={isSuccess}
          />
        </section>
      </main>
    </div>
  );
}
