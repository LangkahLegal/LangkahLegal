"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

// Import Komponen Signup
import SignupHeader from "@/components/auth/signup/SignupHeader";
import SignupForm from "@/components/auth/signup/SignupForm";
import SocialSignup from "@/components/auth/signup/SocialSignup";
import SignupFooter from "@/components/auth/signup/SignupFooter";

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const pendingRole = sessionStorage.getItem("pending_role");
    if (!pendingRole) {
      router.replace("/auth/role");
      return;
    }
    setSelectedRole(pendingRole);
  }, [router]);

  const isConsultant = selectedRole === "konsultan";

  const headerContent = {
    title: isConsultant ? "Daftar sebagai Konsultan" : "Daftar sebagai Client",
    subtitle: isConsultant
      ? "Bergabunglah dengan jaringan pakar hukum kami dan mulai berikan konsultasi profesional."
      : "Daftar sekarang dan cari konsultan hukum terbaik untuk kebutuhan Anda.",
  };

  const handleSignup = async (formData) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      await authService.signUpWithPassword({
        ...formData,
        role: selectedRole,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      });

      sessionStorage.setItem(
        "pending_auth",
        JSON.stringify({
          email: formData.email,
          role: selectedRole,
          flow: "signup",
        }),
      );
      sessionStorage.removeItem("pending_role");

      router.push("/auth/verify");
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mendaftar. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      if (selectedRole) {
        sessionStorage.setItem(
          "pending_auth",
          JSON.stringify({
            role: selectedRole,
            flow: "oauth_signup",
          }),
        );
      }
      await authService.signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (err) {
      setErrorMsg(err?.message || "Gagal login dengan Google.");
    }
  };

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | Tambahkan text-main & transition */
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-6 py-12 bg-bg text-main overflow-x-hidden transition-colors duration-500">
      <main className="relative z-10 w-full max-w-[400px] mx-auto my-auto">
        <SignupHeader
          title={headerContent.title}
          subtitle={headerContent.subtitle}
        />

        <section className="mt-8">
          <SignupForm
            onSubmit={handleSignup}
            isLoading={isLoading}
            errorMsg={errorMsg}
          />

          <SocialSignup onGoogleSignup={handleGoogleSignup} />
        </section>

        <SignupFooter />
      </main>
    </div>
  );
}
