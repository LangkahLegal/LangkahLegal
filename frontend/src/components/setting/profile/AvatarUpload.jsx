import { useRef } from "react";

export default function AvatarUpload({ avatar, name, onChange }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  };

  return (
    <div className="flex flex-col items-center mb-10">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full border-4 border-[#1f1d35] overflow-hidden shadow-2xl">
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-1 right-1 bg-[#6f59fe] p-2.5 rounded-full shadow-lg border-2 border-[#0e0c1e] active:scale-90 transition-transform"
        >
          <span
            className="material-symbols-outlined text-white text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
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