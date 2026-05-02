"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

// Komponen Layout
import PageHeader from "@/components/layout/PageHeader";

// Komponen Modular Verify
import VerifyHero from "@/components/auth/verify/VerifyHero";
import OtpInputGroup from "@/components/auth/verify/OtpInputGroup";
import VerifyActions from "@/components/auth/verify/VerifyActions";

export default function EmailVerificationPage() {
  const [code, setCode] = useState(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputs = useRef([]);
  const router = useRouter();

  // --- Logic OTP Handlers (Tetap) ---
  const handleChange = (index, value) => {
    const val = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);
    if (val && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\s/g, "")
      .slice(0, 6);
    const newCode = [...code];
    pasted.split("").forEach((char, i) => {
      newCode[i] = char;
    });
    setCode(newCode);
    const nextEmpty = newCode.findIndex((c) => !c);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputs.current[focusIndex]?.focus();
  };

  // --- API Handlers (Tetap) ---
  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const pending = sessionStorage.getItem("pending_auth");
      if (!pending) {
        router.push("/auth/login");
        return;
      }

      const { email, flow, role } = JSON.parse(pending);
      await authService.verifyOtp({
        email,
        token: fullCode,
        type: flow === "signup" ? "signup" : "email",
      });

      sessionStorage.removeItem("pending_auth");
      const profile = flow === "signup" ? null : await authService.getProfile();
      const resolvedRole = role || profile?.role || "client";

      if (flow === "signup" || !profile?.role) {
        await authService.updateRole(resolvedRole);
      }

      router.push(
        resolvedRole === "konsultan"
          ? "/dashboard/consultant"
          : "/dashboard/client",
      );
      router.refresh();
    } catch (err) {
      setErrorMsg(err?.message || "Kode OTP tidak valid.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg("");
    try {
      const pending = sessionStorage.getItem("pending_auth");
      if (!pending) {
        router.push("/auth/login");
        return;
      }
      const { email, flow } = JSON.parse(pending);

      if (flow === "signup") {
        await authService.resendSignupOtp({
          email,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        });
      } else {
        await authService.sendOtpLogin({
          email,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        });
      }
      setCode(Array(6).fill(""));
      inputs.current[0]?.focus();
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mengirim ulang OTP.");
    }
  };

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main | font-primary */
    <div className="bg-bg text-main min-h-screen flex flex-col items-center font-primary transition-colors duration-500">
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      <PageHeader
        title="Verifikasi Email"
        backHref="/auth/login"
        onSettingsClick={() => {}}
      />

      <main className="flex-1 w-full max-w-md px-6 pt-12 pb-12 flex flex-col items-center">
        <VerifyHero />

        {errorMsg && (
          /* REFACTOR: Menggunakan skema warna danger theme agar kontras */
          <div className="w-full mb-6 p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        <OtpInputGroup
          code={code}
          inputs={inputs}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        <VerifyActions
          onSubmit={handleSubmit}
          onResend={handleResend}
          isLoading={isLoading}
          isDisableSubmit={code.join("").length < 6}
        />
      </main>
    </div>
  );
}
