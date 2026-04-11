import { MaterialIcon } from "@/components/ui/Icons";

export default function ConsultationForm({
  description,
  onDescriptionChange,
  driveLink,
  onDriveLinkChange,
}) {
  return (
    <div className="space-y-10 w-full">
      {/* Deskripsi */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full" />
          <h2 className="text-base font-bold text-white uppercase tracking-tight">
            Deskripsi Kasus
          </h2>
        </div>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ceritakan detail permasalahan hukum Anda di sini..."
          className="w-full bg-[#1f1d35]/50 border border-white/5 rounded-[1.5rem] p-5 text-sm text-[#e8e2fc] focus:outline-none focus:border-[#6f59fe]/50 transition-all resize-none"
        />
      </section>

      {/* Drive Link */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
          <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
            Link Google Drive
          </h2>
        </div>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#aca8c1] group-focus-within:text-[#6f59fe] transition-colors">
            <MaterialIcon name="link" className="text-2xl" />
          </div>
          <input
            type="url"
            value={driveLink}
            onChange={(e) => onDriveLinkChange(e.target.value)}
            placeholder="Tautkan folder dokumen pendukung di sini..."
            className="w-full bg-[#1f1d35]/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-[#e8e2fc] focus:outline-none focus:border-[#6f59fe]/50 transition-all shadow-inner"
          />
        </div>
        <p className="text-[10px] sm:text-xs text-[#aca8c1] italic px-2">
          *Opsional: Lampirkan link Google Drive jika ada dokumen tambahan.
        </p>
      </section>
    </div>
  );
}
