"use client";

import { useRef } from "react";

export default function AvatarUpload({
  avatar,
  name,
  onChange,
  onUploadStart,
  isUploading,
}) {
  const inputRef = useRef(null);
  const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Proteksi size: Jangan biarkan user upload file terlalu besar (> 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar. Maksimal 2MB.");
      return;
    }

    try {
      if (onUploadStart) onUploadStart();

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (result.success) {
        // Menggunakan url direct link dari IMGBB
        const imageUrl = result.data.url;
        onChange(imageUrl);
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Gagal upload foto. Periksa koneksi internet Anda.");
      if (onChange) onChange(avatar);
    }
  };

  // Helper untuk fallback UI-Avatars
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=1f1d35&color=ada3ff&size=128`;

  return (
    <div className="flex flex-col items-center mb-10">
      <div className="relative group">
        <div
          className={`w-32 h-32 rounded-full border-4 border-[#1f1d35] overflow-hidden shadow-2xl relative transition-all ${
            isUploading ? "opacity-50 scale-95" : "hover:border-[#6f59fe]/50"
          }`}
        >
          <img
            // SENIOR TIP: Gunakan key={avatar} untuk memaksa re-render saat URL ganti
            key={avatar}
            src={avatar && avatar !== "" ? avatar : fallbackUrl}
            alt={name || "Avatar"}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Jika link IMGBB pecah/404, lari ke fallback
              e.target.src = fallbackUrl;
            }}
          />

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="w-8 h-8 border-3 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-1 right-1 bg-[#6f59fe] p-2.5 rounded-full border-2 border-[#0e0c1e] shadow-xl hover:bg-[#5b46e0] active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span
            className="material-symbols-outlined text-white text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isUploading ? "sync" : "edit"}
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

      {isUploading && (
        <p className="text-[10px] text-[#ada3ff] mt-3 font-bold uppercase tracking-[0.2em] animate-pulse">
          Uploading...
        </p>
      )}
    </div>
  );
}
