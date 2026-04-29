"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
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
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | Tambahkan transition-colors */
    <div className="relative min-h-screen bg-bg text-main flex flex-col overflow-x-hidden transition-colors duration-500">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <PageHeader title="Select Role" backHref="/auth/login" />

      <main className="relative z-10 flex-grow flex flex-col px-6 pt-8 pb-20 max-w-md mx-auto w-full">
        <div className="mb-10">
          {/* REFACTOR: text-white -> text-main agar otomatis gelap di Light Mode */}
          <h2 className="font-headline text-3xl font-extrabold text-main mb-4 tracking-tight">
            Pilih Peran Anda
          </h2>

          {error && (
            /* REFACTOR: Menggunakan skema warna danger theme */
            <div className="mb-4 p-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-2xl">
              {error}
            </div>
          )}

          <p className="text-muted leading-relaxed">
            Tentukan bagaimana Anda ingin menggunakan LangkahLegal
          </p>
        </div>

        {/* Roles List */}
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

        {/* Tombol Lanjutkan */}
        <div className="mt-12">
          <Button
            onClick={handleContinue}
            className="w-full py-4 text-lg"
            isLoading={isLoading}
          >
            Lanjutkan
          </Button>
        </div>
      </main>
    </div>
  );
}
