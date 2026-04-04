import { MaterialIcon } from "@/components/ui";

export default function ConsultationCard({ data }) {
  return (
    <section className="glass-card bg-gradient-to-br from-[#6f59fe]/90 to-[#ada3ff]/30 border border-[#48455a]/30 p-6 rounded-[2rem] space-y-6 relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#e8e2fc]/20 text-[#e8e2fc] font-semibold text-xs uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-[#ada3ff]" />
          {data.status}
        </div>
        <button className="btn-icon">
          <MaterialIcon name="more_vert" className="text-[#e8e2fc] text-2xl" />
        </button>
      </div>

      <h2 className="text-xl font-headline font-bold text-white">
        Konsultasi Berlangsung
      </h2>

      <div className="bg-[#e8e2fc]/10 p-4 rounded-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/20">
          <img
            src={data.consultant.avatar}
            alt={data.consultant.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-0.5 flex-1">
          <p className="text-[#e8e2fc] font-headline font-semibold text-sm">
            {data.consultant.name}
          </p>
          <p className="text-[#aca8c1] text-xs leading-relaxed">
            {data.consultant.specialization}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-[#aca8c1] text-xs">
        <MaterialIcon
          name="calendar_today"
          className="text-xl text-[#ada3ff]"
        />
        <span>{data.time}</span>
      </div>
    </section>
  );
}
