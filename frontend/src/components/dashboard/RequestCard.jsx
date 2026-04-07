import { MaterialIcon } from "@/components/ui";

export default function RequestCard({ name, caseType, time }) {
  return (
    <div className="glass-card bg-[#1f1d35] border border-white/5 p-5 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#ada3ff]/20 transition-colors">
        <MaterialIcon name="person_add" className="text-[#ada3ff]" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white text-sm">{name}</h4>
        <p className="text-xs text-[#aca8c1]">
          {caseType} • {time}
        </p>
      </div>
      <MaterialIcon
        name="chevron_right"
        className="text-[#aca8c1] group-hover:translate-x-1 transition-transform"
      />
    </div>
  );
}
