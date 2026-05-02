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
    // Simulasi proses penyimpanan
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1500);
  };

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main | font-primary */
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Bahasa" />

        {/* Efek Glow Latar Belakang - Opacity disesuaikan agar tidak terlalu mencolok di light mode */}
        <div className="glow-top-left-purple opacity-10 dark:opacity-20" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            {/* 1. Header Section */}
            <div className="space-y-3">
              {/* REFACTOR: text-white -> text-main */}
              <h2 className="text-3xl font-extrabold text-main tracking-tight transition-colors duration-500">
                Pilih Bahasa
              </h2>
              {/* REFACTOR: text-[#aca8c1] -> text-muted */}
              <p className="text-sm leading-relaxed text-muted">
                Pilih bahasa yang Anda inginkan untuk pengalaman layanan hukum
                yang lebih nyaman.
              </p>
            </div>

            {/* 2. Language Options List */}
            <div className="space-y-4">
              {LANGUAGES.map((lang) => {
                const isActive = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id || "unknown"}
                    onClick={() => setSelectedLang(lang.id)}
                    /* REFACTOR: 
                        Active: bg-primary/10 border-primary
                        Inactive: bg-card/30 border-surface 
                    */
                    className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300 group ${
                      isActive
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/5"
                        : "bg-card/30 border-surface hover:border-primary/20"
                    }`}
                  >
                    <div className="text-left">
                      <p
                        /* REFACTOR: text-main */
                        className={`font-bold transition-colors ${
                          isActive ? "text-primary-light" : "text-main"
                        }`}
                      >
                        {lang.name || "Unknown Language"}
                      </p>
                      <p className="text-[10px] font-bold tracking-[0.15em] text-muted uppercase mt-0.5">
                        {lang.sub || ""}
                      </p>
                    </div>

                    {/* Radio / Check Icon */}
                    <div
                      /* REFACTOR: bg-primary border-primary | border-muted/30 */
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-primary border-primary"
                          : "border-muted/30"
                      }`}
                    >
                      {isActive && (
                        <MaterialIcon
                          name="check"
                          className="text-white text-base"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 3. Action Button */}
            <div className="pt-6">
              <Button
                fullWidth
                isLoading={isLoading}
                onClick={handleSave}
                /* Menggunakan shadow-primary agar berpijar sesuai tema */
                className="py-6 rounded-2xl shadow-lg shadow-primary/20 font-bold text-base"
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
