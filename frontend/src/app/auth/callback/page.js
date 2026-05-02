"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

// Import Komponen Modular
import CallbackBackground from "@/components/auth/callback/CallbackBackground";
import CallbackLoading from "@/components/auth/callback/CallbackLoading";
import CallbackError from "@/components/auth/callback/CallbackError";

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
          role === "konsultan" ? "/dashboard/consultant" : "/dashboard/client",
        );
      } catch (err) {
        setError(err?.message || "Gagal memproses login.");
      }
    };

    finalizeLogin();
  }, [router]);

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0e0c1e] px-6 overflow-hidden">
      <CallbackBackground />

      <main className="relative z-10 w-full max-w-[400px] text-center">
        {error ? (
          <CallbackError
            error={error}
            onRetry={() => router.replace("/auth/login")}
          />
        ) : (
          <CallbackLoading />
        )}
      </main>
    </div>
  );
}
