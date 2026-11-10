"use client";

import React, { useRef } from "react";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function AvatarUpload({
  foto_profil,
  name,
  onChange,
  onUploadStart,
  isUploading,
}) {
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) {
      return file && alert("File terlalu besar (max 2MB)");
    }

    if (onUploadStart) onUploadStart();

    try {
      // Upload foto ke backend (disimpan ke Supabase Storage), lalu ambil URL terbaru.
      await userService.updateProfile({ foto_profil_file: file });
      const freshData = await userService.getFullProfile();

      onChange(freshData.foto_profil);
    } catch (err) {
      alert("Gagal mengunggah foto.");
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
          <UserAvatar
            src={foto_profil}
            name={name || "User"}
            alt="Profile"
            size="xl"
            textClassName="text-4xl"
            className="w-full h-full object-cover"
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
            variant="secondary"
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
