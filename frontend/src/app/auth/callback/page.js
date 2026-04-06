"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const finalizeLogin = async () => {
      try {
        const session = await authService.getSession();

        if (!session) {
          router.replace("/auth/login");
          return;
        }

        const pending = sessionStorage.getItem("pending_auth");
        if (pending) {
          const { role, flow } = JSON.parse(pending);
          if (flow === "oauth_signup" && role) {
            await authService.updateRole(role);
          }
          sessionStorage.removeItem("pending_auth");
        }

        const profile = await authService.getProfile();
        let role = profile?.role;

        if (!role) {
          role = "client";
          await authService.updateRole(role);
        }

        router.replace(
          role === "konsultan" ? "/dashboard/consultan" : "/dashboard/client",
        );
      } catch (err) {
        const message = err?.message || "Gagal memproses login.";
        setError(message);
      }
    };

    finalizeLogin();
  }, [router]);

  return (
    <div className="auth-screen flex items-center justify-center">
      <div className="auth-container text-center">
        <h1 className="auth-title">Memproses login...</h1>
        <p className="auth-subtitle">
          Mohon tunggu, kami sedang menyiapkan akun Anda.
        </p>
        {error && (
          <div className="mt-6 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
