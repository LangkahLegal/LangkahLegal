"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

const LANGUAGES = [
  { id: "id", name: "Bahasa Indonesia", sub: "INDONESIAN" },
  { id: "en", name: "English", sub: "UNITED KINGDOM" },
  { id: "zh", name: "Mandarin", sub: "CHINESE" },
  { id: "ja", name: "日本語", sub: "JAPANESE" },
];

export default function LanguageSettingsPage() {
  const [selectedLang, setSelectedLang] = useState("id");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    // Simulasi proses penyimpanan ke DB/Local Storage
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1500);
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Bahasa" />

        {/* Efek Glow Latar Belakang */}
        <div className="glow-top-left-purple opacity-20" />

        <main className="flex-1 overflow-y-auto px-6 pb-40 pt-10 scroll-smooth relative z-10">
          <div className="max-w-md mx-auto w-full space-y-10">
            {/* 1. Header Section */}
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Pilih Bahasa
              </h2>
              <p className="text-sm leading-relaxed text-[#aca8c1]">
                Pilih bahasa yang Anda inginkan untuk pengalaman layanan hukum
                yang lebih nyaman.
              </p>
            </div>

            {/* 2. Language Options List */}
            <div className="space-y-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300 group ${
                    selectedLang === lang.id
                      ? "bg-[#6f59fe]/10 border-[#6f59fe] shadow-[0_0_20px_rgba(111,89,254,0.1)]"
                      : "bg-[#1f1d35]/30 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="text-left">
                    <p
                      className={`font-bold transition-colors ${
                        selectedLang === lang.id
                          ? "text-white"
                          : "text-[#e8e2fc]"
                      }`}
                    >
                      {lang.name}
                    </p>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#aca8c1] uppercase mt-0.5">
                      {lang.sub}
                    </p>
                  </div>

                  {/* Radio / Check Icon */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedLang === lang.id
                        ? "bg-[#6f59fe] border-[#6f59fe]"
                        : "border-[#aca8c1]/30"
                    }`}
                  >
                    {selectedLang === lang.id && (
                      <MaterialIcon
                        name="check"
                        className="text-white text-base"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 3. Action Button */}
            <div className="pt-6">
              <Button
                fullWidth
                isLoading={isLoading}
                onClick={handleSave}
                className="py-6 rounded-2xl shadow-[0_10px_30px_rgba(111,89,254,0.3)] font-bold text-base"
              >
                Simpan Pengaturan
              </Button>
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
