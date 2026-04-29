"use client";

import { useState } from "react";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui";

export default function ChangePasswordCard() {
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("Saving passwords...");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#1f1d35]/50 p-6 rounded-2xl border border-white/5 space-y-6 backdrop-blur-sm">
      <h2 className="font-headline font-bold text-lg text-main tracking-tight">
        Ubah Password
      </h2>

      <div className="space-y-4">
        <PasswordField
          label="Password Lama"
          name="old"
          placeholder="Masukkan password lama"
          value={passwords.old}
          onChange={handleChange}
        />

        <PasswordField
          label="Password Baru"
          name="new"
          placeholder="Masukkan password baru"
          value={passwords.new}
          onChange={handleChange}
        />

        <PasswordField
          label="Konfirmasi Password Baru"
          name="confirm"
          placeholder="Ulangi password baru"
          value={passwords.confirm}
          onChange={handleChange}
        />
      </div>

      <div className="pt-2">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={isSaving || !passwords.old || !passwords.new}
        >
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
