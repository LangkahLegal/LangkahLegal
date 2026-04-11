"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui";

export default function ThemePage() {
  const [theme, setTheme] = useState("dark");
  const [saved, setSaved] = useState("dark");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = theme !== saved;

  const handleSave = async () => {
    if (!hasChanged) return;

    setIsSaving(true);
    try {
      // TODO: API / localStorage
      // localStorage.setItem("theme", theme);

      setSaved(theme);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const options = [
    { id: "light", label: "Terang" },
    { id: "dark", label: "Gelap" },
    { id: "system", label: "Ikuti Sistem" },
  ];

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <PageHeader title="Tema Aplikasi" />

        <main className="flex-1 px-6 pt-8 pb-32">
          <div className="max-w-2xl mx-auto space-y-4">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`w-full flex justify-between p-5 rounded-2xl border ${
                  theme === opt.id
                    ? "bg-[#6f59fe]/20 border-[#6f59fe]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <span>{opt.label}</span>
                {theme === opt.id && (
                  <span className="text-[#6f59fe] text-sm font-bold">
                    Dipilih
                  </span>
                )}
              </button>
            ))}
                {/* SAVE BUTTON */}
                <div className="pt-8 w-full">
                <Button
                    onClick={handleSave}
                    fullWidth
                    >
                    {   isSaving
                        ? "Saving..."
                        : "Simpan Perubahan"}
                </Button>
                </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}