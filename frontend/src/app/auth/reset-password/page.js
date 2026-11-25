"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import Link from "next/link";

import ResetPasswordHeader from "@/components/auth/reset-password/ResetPasswordHeader";
import ResetPasswordForm from "@/components/auth/reset-password/ResetPasswordForm";
import { useToast } from "@/providers/FeedbackProvider";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyRecoveryToken = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");
      const email = searchParams.get("email");

      if (!token || type !== "recovery" || !email) {
        setVerifyError(
          "Link reset password tidak valid. Silakan minta link baru melalui halaman Lupa Password."
        );
        setIsVerifying(false);
        return;
      }

      try {
        const data = await authService.verifyOtp({
          email: decodeURIComponent(email),
          token,
          type: "recovery",
        });

        if (data?.authenticated) {
          setIsVerified(true);
        } else {
          setVerifyError(
            "Gagal memverifikasi token. Silakan minta link reset password baru."
          );
        }
      } catch (err) {
        const message = err?.message || "";
        if (
          message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("kadaluarsa")
        ) {
          setVerifyError(
            "Link reset password sudah kadaluarsa. Silakan minta link baru melalui halaman Lupa Password."
          );
        } else {
          setVerifyError(
            message ||
              "Gagal memverifikasi token. Silakan minta link reset password baru."
          );
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRecoveryToken();
  }, [searchParams]);

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
      toast.success("Password berhasil diubah! Silakan login dengan password baru Anda.");
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
        {isVerifying ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-main tracking-tight">
                Memverifikasi link...
              </h1>
              <p className="text-muted text-sm leading-relaxed">
                Mohon tunggu sebentar, kami sedang memverifikasi link reset password Anda.
              </p>
            </div>
          </div>
        ) : verifyError ? (
          <div className="space-y-6 text-center md:text-left">
            <header className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-soft border border-danger/20 mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="font-headline text-[2rem] md:text-[2.25rem] font-extrabold tracking-tighter text-main leading-tight" data-testid="reset-password-invalid-title">
                Link Tidak Valid
              </h1>
            </header>
            <div className="p-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-xl" data-testid="reset-password-verify-error">
              {verifyError}
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Link
                href="/auth/forgot-password"
                data-testid="reset-password-request-link"
                className="block text-center w-full py-3 px-4 bg-secondary text-on-secondary font-bold rounded-xl hover:bg-secondary-hover transition-colors"
              >
                Minta Link Baru
              </Link>
              <Link
                href="/auth/login"
                className="block text-center text-sm py-2 text-primary-light font-bold transition-colors duration-200 hover:underline underline-offset-4"
              >
                Kembali ke Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ResetPasswordHeader />
            <section>
              <ResetPasswordForm
                onSubmit={handleResetPassword}
                isLoading={isLoading}
                errorMsg={errorMsg}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
