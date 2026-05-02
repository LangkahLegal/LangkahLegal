"use client";

import React, { useRef } from "react";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function AvatarUpload({
  foto_profil,
  name,
  onChange,
  onUploadStart,
  isUploading,
}) {
  const inputRef = useRef(null);
  const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  // Fallback URL menggunakan variabel warna yang mendekati tema Dark Tech secara default
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=1f1d35&color=ada3ff&size=128`;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) {
      return file && alert("File terlalu besar (max 2MB)");
    }

    if (onUploadStart) onUploadStart();
    const formData = new FormData();
    formData.append("image", file);

    try {
      // 1. Upload ke IMGBB
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        { method: "POST", body: formData },
      );
      const { success, data } = await res.json();
      if (!success) throw new Error();

      // 2. Sync ke DB & Fetch Fresh Data
      await userService.updateProfile({ foto_profil: data.url });
      const freshData = await userService.getFullProfile();

      // 3. Update UI dengan prioritas data dari DB
      onChange(freshData.foto_profil || data.url);
    } catch (err) {
      alert("Gagal sinkronisasi foto.");
      onChange(foto_profil);
    }
  };

  return (
    <div className="flex flex-col items-center mb-10">
      <div className="relative group">
        {/* Container Avatar: Menggunakan bg-input dan border-card */}
        <div
          className={`
            w-32 h-32 rounded-full border-4 border-card overflow-hidden shadow-soft relative bg-input
            transition-all duration-300
            ${isUploading ? "opacity-50 scale-95" : "hover:shadow-primary/10"}
          `}
        >
          <img
            key={foto_profil}
            src={foto_profil || fallbackUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = fallbackUrl)}
          />

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-[2px]">
              <div className="w-8 h-8 border-3 border-primary-light border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Tombol Edit: Menggunakan komponen Button UI */}
        <div className="absolute bottom-1 right-1">
          <Button
            variant="primary"
            type="button"
            onClick={() => !isUploading && inputRef.current.click()}
            className="!p-2.5 !rounded-full border-2 border-bg shadow-xl"
            aria-label="Edit Profile Picture"
          >
            <MaterialIcon name="edit" className="text-sm" />
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
