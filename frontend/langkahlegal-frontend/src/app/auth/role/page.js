"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, MaterialIcon } from "../../../components/ui";

export default function RolePage() {
  const [selectedRole, setSelectedRole] = useState("client");
  const router = useRouter();

  const handleContinue = () => {
    router.push(selectedRole === "client" ? "/auth/signup-client" : "/auth/signup-consultant");
  };

  const roles = [
    {
      value: "client",
      icon: "person_search",
      title: "Client",
      description: "Saya membutuhkan bantuan hukum profesional dari pakar yang terpercaya",
    },
    {
      value: "konsultan",
      icon: "gavel",
      title: "Konsultan Hukum",
      description: "Saya ingin memberikan jasa konsultasi dan memperluas jangkauan klien",
    },
  ];

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col selection:bg-[#6D57FC]/30">
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      <header className="top-nav">
        <div className="flex items-center w-full max-w-md mx-auto">
          <button onClick={() => router.back()} className="btn-icon">
            <MaterialIcon name="arrow_back" />
          </button>
          <h1 className="top-nav-title">Select Role</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col px-6 pt-8 pb-32 max-w-md mx-auto w-full relative z-10">
        <div className="mb-10">
          <h2 className="page-title mb-4">Pilih Peran Anda</h2>
          <p className="page-subtitle">Tentukan bagaimana Anda ingin menggunakan LangkahLegal</p>
        </div>

        <div className="space-y-6">
          {roles.map((role) => {
            const isActive = selectedRole === role.value;
            return (
              <label key={role.value} className="group relative block cursor-pointer outline-none">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={isActive}
                  onChange={() => setSelectedRole(role.value)}
                  className="peer hidden"
                />
                <div className={`role-card ${isActive ? "role-card-active" : "role-card-inactive"}`}>
                  <div className="flex items-start justify-between">
                    <div className="role-card-icon">
                      <MaterialIcon
                        name={role.icon}
                        className="text-5xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      />
                    </div>
                    <div className={`role-radio ${isActive ? "role-radio-active" : "role-radio-inactive"}`}>
                      {isActive && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-[#e8e2fc]" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                      {role.title}
                    </h3>
                    <p className="text-[#aca8c1] text-base leading-relaxed">{role.description}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </main>

      <footer className="bottom-nav">
        <Button onClick={handleContinue} className="max-w-md">
          Lanjutkan
        </Button>
      </footer>
    </div>
  );
}