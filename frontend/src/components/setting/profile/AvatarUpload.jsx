"use client";

import { useRef } from "react";
import { userService } from "@/services/user.service";

export default function AvatarUpload({
  foto_profil,
  name,
  onChange,
  onUploadStart,
  isUploading,
}) {
  const inputRef = useRef(null);
  const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Luthfi")}&background=1f1d35&color=ada3ff&size=128`;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024)
      return file && alert("File terlalu besar (max 2MB)");

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
        <div
          className={`w-32 h-32 rounded-full border-4 border-[#1f1d35] overflow-hidden shadow-2xl relative ${isUploading ? "opacity-50 scale-95" : ""}`}
        >
          <img
            key={foto_profil}
            src={foto_profil || fallbackUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = fallbackUrl)}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="w-8 h-8 border-3 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => !isUploading && inputRef.current.click()}
          className="absolute bottom-1 right-1 bg-[#6f59fe] p-2.5 rounded-full border-2 border-[#0e0c1e] shadow-xl active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-white text-sm">
            edit
          </span>
        </button>
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
