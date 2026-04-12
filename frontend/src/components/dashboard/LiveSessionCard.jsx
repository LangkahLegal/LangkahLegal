import { MaterialIcon } from "@/components/ui";

export default function LiveSessionCard({
  clientName,
  caseType,
  time,
  avatar,
}) {
  return (
    <div className="glass-card bg-input border border-primary/30 p-6 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
      <div className="flex justify-between items-center relative z-10">
        <div className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-primary-light tracking-widest">
            LIVE
          </span>
        </div>
        <MaterialIcon name="more_vert" className="text-muted cursor-pointer" />
      </div>

      <div className="space-y-4 relative z-10">
        <h3 className="text-lg font-headline font-bold text-main">
          Konsultasi Berlangsung
        </h3>
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 group-hover:bg-white/10 transition-colors">
          <img
            src={avatar || "/api/placeholder/48/48"}
            className="w-12 h-12 rounded-xl object-cover"
            alt="client"
          />
          <div>
            <h4 className="font-bold text-main text-sm">{clientName}</h4>
            <p className="text-xs text-muted">{caseType}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2 text-muted">
          <MaterialIcon name="calendar_today" className="text-sm" />
          <span className="text-xs font-medium">{time}</span>
        </div>
        {/* Tombol dimapping ke primary, teks ke dark sesuai konvensi btn-primary */}
        <button className="bg-primary text-dark px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/40 hover:brightness-110 active:scale-95 transition-all">
          Mulai Sesi
        </button>
      </div>
    </div>
  );
}
