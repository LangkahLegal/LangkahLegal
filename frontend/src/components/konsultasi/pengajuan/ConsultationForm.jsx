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
          <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
          <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
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

      
    </div>
  );
}
