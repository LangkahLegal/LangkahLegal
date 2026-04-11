"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui";

export default function LanguagePage() {
  const [selected, setSelected] = useState("id");
  const [saved, setSaved] = useState("id");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = selected !== saved;

  const handleSave = async () => {
    if (!hasChanged) return;

    setIsSaving(true);
    try {
      // TODO: API CALL
      // await userService.updateSetting({ language: selected });

      setSaved(selected);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const languages = [
    { id: "id", label: "Bahasa Indonesia" },
    { id: "en", label: "English" },
  ];

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <PageHeader title="Bahasa" />

        <main className="flex-1 px-6 pt-8 pb-32">
          <div className="max-w-2xl mx-auto space-y-4">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                className={`w-full flex justify-between p-5 rounded-2xl border ${
                  selected === lang.id
                    ? "bg-[#6f59fe]/20 border-[#6f59fe]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <span>{lang.label}</span>
                {selected === lang.id && (
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