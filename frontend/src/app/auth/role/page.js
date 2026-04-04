"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui";
import RoleHeader from "../../../components/role/RoleHeader";
import RoleCard from "../../../components/role/RoleCard";

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
  const router = useRouter();
  const handleContinue = () => {
  
    router.push(`/auth/login?role=${selectedRole}`);
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col selection:bg-[#6D57FC]/30">
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      <RoleHeader onBack={() => router.back()} title="Select Role" />

      <main className="flex-grow flex flex-col px-6 pt-8 pb-32 max-w-md mx-auto w-full relative z-10">
        <div className="mb-10">
          <h2 className="page-title mb-4 text-3xl font-bold">
            Pilih Peran Anda
          </h2>
          <p className="page-subtitle text-[#aca8c1]">
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

      <footer className="bottom-nav p-6 fixed bottom-0 left-0 right-0 bg-[#0e0c1e]/80 backdrop-blur-md z-20">
        <div className="max-w-md mx-auto w-full">
          <Button onClick={handleContinue} className="w-full">
            Lanjutkan ke Login
          </Button>
        </div>
      </footer>
    </div>
  );
}
