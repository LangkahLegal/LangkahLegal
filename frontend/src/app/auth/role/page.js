"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
// Import PageHeader baru
import PageHeader from "@/components/layout/PageHeader";
import RoleCard from "@/components/role/RoleCard";

const ROLES_DATA = [
  {
    value: "client",
    icon: "person_search",
    title: "Client",
    description:
      "Saya membutuhkan bantuan hukum profesional dari pakar yang terpercaya",
  },
  {
    value: "konsultan",
    icon: "gavel",
    title: "Konsultan Hukum",
    description:
      "Saya ingin memberikan jasa konsultasi dan memperluas jangkauan klien",
  },
];

export default function RolePage() {
  const [selectedRole, setSelectedRole] = useState("client");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleContinue = async () => {
    setIsLoading(true);
    setError("");

    try {
      sessionStorage.setItem("pending_role", selectedRole);
      router.push("/auth/signup");
    } catch (err) {
      setError(err?.message || "Gagal menyimpan peran. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col selection:bg-[#6D57FC]/30">
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      {/* MENGGUNAKAN PAGEHEADER GLOBAL
        Eksplisit mengarahkan backHref ke login karena ini alur onboarding 
      */}
      <PageHeader title="Select Role" backHref="/auth/login" />

      <main className="flex-grow flex flex-col px-6 pt-8 pb-32 max-w-md mx-auto w-full relative z-10">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pilih Peran Anda
          </h2>

          {error && (
            <div className="mb-4 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <p className="text-[#aca8c1]">
            Tentukan bagaimana Anda ingin menggunakan LangkahLegal
          </p>
        </div>

        <div className="space-y-6">
          {ROLES_DATA.map((role) => (
            <RoleCard
              key={role.value}
              role={role}
              isActive={selectedRole === role.value}
              onSelect={setSelectedRole}
            />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-[#0e0c1e]/80 backdrop-blur-md z-20 border-t border-white/5">
        <div className="max-w-md mx-auto w-full">
          <Button
            onClick={handleContinue}
            className="w-full"
            isLoading={isLoading} // Menggunakan standar Button UI Anda
          >
            {isLoading ? "Memproses..." : "Lanjutkan"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
