import { MaterialIcon } from "@/components/ui/Icons";

export default function ConsultationForm({
  description = "", // Safety: default value string kosong
  onDescriptionChange,
  driveLink = "", // Safety: default value string kosong
  onDriveLinkChange,
}) {
  return (
    <div className="space-y-10 w-full">
      {/* Deskripsi */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          {/* REFACTOR: bg-[#6f59fe] -> bg-primary | shadow menggunakan primary-rgb */}
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />

          {/* REFACTOR: text-white -> text-main */}
          <h2 className="text-base sm:text-lg font-bold text-main uppercase tracking-tight transition-colors duration-500">
            Deskripsi Kasus
          </h2>
        </div>

        <textarea
          rows={4}
          value={description ?? ""} // Pastikan tidak pernah undefined
          onChange={(e) => onDescriptionChange?.(e.target.value)}
          placeholder="Ceritakan detail permasalahan hukum Anda di sini..."
          className="w-full bg-input border border-surface rounded-[1.5rem] p-5 text-sm text-main placeholder:text-muted/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none duration-500"
        />
      </section>
    </div>
  );
}
