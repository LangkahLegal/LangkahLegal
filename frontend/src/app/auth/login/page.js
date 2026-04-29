"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

// Import Komponen Baru
import LoginHeader from "@/components/auth/login/LoginHeader";
import LoginForm from "@/components/auth/login/LoginForm";
import SocialLogin from "@/components/auth/login/SocialLogin";
import LoginFooter from "@/components/auth/login/LoginFooter";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handlePasswordLogin = async (formData) => {
    if (!formData.password) {
      setErrorMsg("Password wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const session = await authService.loginWithPassword(formData);

      if (!session) {
        setErrorMsg("Email atau password salah.");
        return;
      }

      const profile = await authService.getProfile();
      const role = profile?.role;

      if (!role) {
        router.push("/auth/role");
        return;
      }

      router.push(
        role === "konsultan" ? "/dashboard/consultant" : "/dashboard/client",
      );
      router.refresh();
    } catch (err) {
      setErrorMsg(err?.message || "Gagal login. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      await authService.signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal login dengan Google.");
    }
  };

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | Tambahkan text-main & transition */
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-6 py-8 bg-bg text-main overflow-hidden transition-colors duration-500">
      <main className="relative z-10 w-full max-w-[400px] mx-auto">
        <LoginHeader />

        <section>
          <LoginForm
            onSubmit={handlePasswordLogin}
            isLoading={isLoading}
            errorMsg={errorMsg}
          />

          <SocialLogin onGoogleLogin={handleGoogleLogin} />
        </section>

        <LoginFooter />
      </main>
    </div>
  );
}
