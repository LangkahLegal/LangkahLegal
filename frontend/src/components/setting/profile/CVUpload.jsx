import { useRef } from "react";

export default function CVUpload({ file, onChange }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) onChange(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div className="space-y-2">
      <label className="block font-['Inter',sans-serif] text-[10px] font-bold text-[#aca8c1] px-1 uppercase tracking-[0.15em]">
        Unggah CV
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full bg-white/5 backdrop-blur-md border-2 border-dashed border-[#6D57FC]/20 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:border-[#6D57FC]/40 cursor-pointer group"
        style={{ boxShadow: "inset 0 0 10px rgba(109,87,252,0.1)" }}
      >
        <div className="bg-[#6f59fe]/20 p-3 rounded-full group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-[#ada3ff]">cloud_upload</span>
        </div>

        <div className="text-center">
          {file ? (
            <>
              <p className="text-sm font-medium text-[#ada3ff]">{file.name}</p>
              <p className="text-[10px] text-[#aca8c1] mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[#e8e2fc]">Pilih file atau tarik ke sini</p>
              <p className="text-[10px] text-[#aca8c1] mt-1">PDF, DOC (Maks. 5MB)</p>
            </>
          )}
        </div>

        <button
          type="button"
          className="mt-2 text-xs font-bold text-[#ada3ff] px-4 py-2 bg-[#ada3ff]/10 rounded-lg hover:bg-[#ada3ff]/20 transition-colors"
        >
          Browse Files
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}