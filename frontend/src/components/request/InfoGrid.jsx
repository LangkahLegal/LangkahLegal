import { MaterialIcon } from "@/components/ui/Icons";

const InfoItem = ({ label, value, icon }) => (
  <div className="bg-[#1f1d35] p-5 rounded-[28px] border border-white/5 space-y-2">
    <p className="text-[9px] font-bold text-[#aca8c1] uppercase tracking-[0.15em]">
      {label}
    </p>
    <div className="flex items-center gap-2.5">
      <MaterialIcon name={icon} className="text-blue-400 text-base" />
      <span className="text-[11px] font-bold text-white uppercase tracking-tight">
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
