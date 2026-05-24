"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

import CreatePasswordHeader from "@/components/auth/create-password/CreatePasswordHeader";
import CreatePasswordForm from "@/components/auth/create-password/CreatePasswordForm";

export default function CreatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Ambil data dari sessionStorage yang disimpan oleh callback
    const pending = sessionStorage.getItem("pending_create_password");
    if (!pending) {
      // Jika tidak ada pending, user mungkin langsung akses URL ini
      // Tetap izinkan — mungkin mereka memang perlu buat password
      return;
    }
    try {
      const parsed = JSON.parse(pending);
      setRole(parsed.role);
    } catch {
      // Ignore parse error
    }
  }, []);

  const handleCreatePassword = async ({ password }) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      await authService.createPassword({ password });

      // Hapus flag pending
      sessionStorage.removeItem("pending_create_password");

      // Redirect ke dashboard sesuai role
      if (role === "admin") {
        router.replace("/dashboard/admin");
      } else if (role === "konsultan") {
        router.replace("/dashboard/consultant");
      } else {
        router.replace("/dashboard/client");
      }
      router.refresh();
    } catch (err) {
      setErrorMsg(err?.message || "Gagal membuat password. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-6 py-12 bg-bg text-main overflow-x-hidden transition-colors duration-500">
      <main className="relative z-10 w-full max-w-[400px] mx-auto my-auto">
        <CreatePasswordHeader />

        <section className="mt-2">
          <CreatePasswordForm
            onSubmit={handleCreatePassword}
            isLoading={isLoading}
            errorMsg={errorMsg}
          />
        </section>
      </main>
    </div>
  );
}
