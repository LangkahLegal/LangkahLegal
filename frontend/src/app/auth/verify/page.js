"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "../../../components/ui";
import { authService } from "@/services/auth.service";

// Import Komponen PageHeader
import PageHeader from "@/components/layout/PageHeader";

export default function EmailVerificationPage() {
  const [code, setCode] = useState(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputs = useRef([]);
  const router = useRouter();

  const handleChange = (index, value) => {
    const val = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);

    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
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

      if (flow === "signup") {
        const resolvedRole = role || "client";
        await authService.updateRole(resolvedRole);
        router.push(
          resolvedRole === "konsultan"
            ? "/dashboard/consultant"
            : "/dashboard/client",
        );
        router.refresh();
        return;
      }

      const profile = await authService.getProfile();
      let resolvedRole = profile?.role;
      if (!resolvedRole) {
        resolvedRole = "client";
        await authService.updateRole(resolvedRole);
      }
      router.push(
        resolvedRole === "konsultan"
          ? "/dashboard/consultant"
          : "/dashboard/client",
      );
      router.refresh();
    } catch (err) {
      const message = err?.message || "Kode OTP tidak valid.";
      setErrorMsg(message);
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
      const message = err?.message || "Gagal mengirim ulang OTP.";
      setErrorMsg(message);
    }
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col items-center font-['Inter',sans-serif]">
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      {/* --- REFACTOR: Menggunakan PageHeader --- */}
      <PageHeader
        title="Verifikasi Email"
        backHref="/auth/login"
        onSettingsClick={() => {}} // Kosongkan karena di page OTP belum ada setting
      />

      <main className="flex-1 w-full max-w-md px-6 pt-12 pb-12 flex flex-col items-center">
        {/* Hero Banner */}
        <div className="w-full relative mb-10 overflow-hidden rounded-3xl h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(111,89,254,0.3),transparent_70%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#131125] via-[#1f1d35] to-[#131125] opacity-90" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#6f59fe] rounded-full blur-[80px] opacity-20" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#ada3ff] rounded-full blur-[80px] opacity-20" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ada3ff] blur-2xl opacity-40 rounded-full scale-75" />
              <MaterialIcon
                name="mark_email_unread"
                className="relative z-20 text-[#ada3ff]"
                style={{
                  fontSize: "80px",
                  filter: "drop-shadow(0 0 15px rgba(173,163,255,0.8))",
                }}
              />
            </div>
            <div className="mt-2 w-12 h-1 bg-gradient-to-r from-transparent via-[#ada3ff]/30 to-transparent rounded-full" />
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3 mb-10">
          <h2
            className="text-3xl font-bold tracking-tight text-[#e8e2fc]"
            style={{ fontFamily: "Urbanist, sans-serif" }}
          >
            LangkahLegal
          </h2>
          <p className="text-[#aca8c1] text-base leading-relaxed max-w-[280px] mx-auto">
            Masukkan 6 digit kode yang telah kami kirimkan ke email Anda
          </p>
        </div>

        {errorMsg && (
          <div className="w-full mb-6 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* OTP Input Grid */}
        <div
          className="grid grid-cols-6 gap-3 mb-12 w-full"
          onPaste={handlePaste}
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              placeholder="-"
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
            />
          ))}
        </div>

        {/* CTA */}
        <div className="w-full space-y-6">
          <button
            onClick={handleSubmit}
            disabled={code.join("").length < 6 || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? "Memverifikasi..." : "Verifikasi"}
          </button>

          <div className="flex flex-col items-center gap-2">
            <p className="text-[#aca8c1] text-sm">Tidak menerima kode?</p>
            <button
              onClick={handleResend}
              className="text-[#ada3ff] font-semibold text-sm hover:text-[#e8e2fc] transition-colors"
            >
              Kirim Ulang
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
