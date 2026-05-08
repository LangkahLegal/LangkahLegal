import { MaterialIcon } from "@/components/ui/Icons";

const InfoItem = ({ label, value, icon }) => (
  /* REFACTOR: bg-[#1f1d35] -> bg-card | border-white/5 -> border-surface */
  <div className="bg-card p-5 rounded-[28px] border border-surface space-y-2 transition-colors duration-500">
    {/* REFACTOR: text-[#aca8c1] -> text-muted */}
    <p className="text-[9px] font-bold text-muted uppercase tracking-[0.15em]">
      {label}
    </p>
    <div className="flex items-center gap-2.5">
      {/* REFACTOR: text-blue-400 -> text-primary */}
      <MaterialIcon name={icon} className="text-primary text-base" />
      {/* REFACTOR: text-white -> text-main */}
      <span className="text-[11px] font-bold text-main uppercase tracking-tight">
        {value}
      </span>
    </div>
  </div>
);

export default function InfoGrid({ date, time }) {
  return (
    <section className="grid grid-cols-2 gap-4">
      <InfoItem label="Tanggal Konsultasi" value={date} icon="calendar_today" />
      <InfoItem label="Jam Konsultasi" value={time} icon="schedule" />
    </section>
  );
}
