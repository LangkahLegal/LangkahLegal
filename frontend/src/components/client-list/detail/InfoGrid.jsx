import { MaterialIcon } from "@/components/ui/Icons";

export default function InfoGrid({ sentTime, date, time }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <InfoCard 
        icon="schedule" 
        label="Waktu Pengajuan" 
        value={sentTime || "-"} 
        className="col-span-2"
      />
      <InfoCard 
        icon="calendar_today" 
        label="Tanggal Konsultasi" 
        value={date || "-"} 
      />
      <InfoCard 
        icon="access_time" 
        label="Jam Konsultasi" 
        value={time || "-"} 
      />
    </div>
  );
}

// InfoCard dimasukkan di file yang sama agar InfoGrid bisa menggunakannya
function InfoCard({ icon, label, value, className = "" }) {
  return (
    <div className={`bg-[#1f1d35] p-3.5 md:p-5 rounded-[1.5rem] border border-white/5 flex flex-col justify-center gap-1.5 ${className}`}>
      <p className="text-[9px] md:text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider line-clamp-1">
        {label}
      </p>
      <div className="flex items-center gap-1.5 md:gap-2">
        <MaterialIcon name={icon} className="text-[#ada3ff] text-[14px] md:text-sm shrink-0" />
        <span className="text-xs md:text-sm font-bold text-white truncate">
          {value}
        </span>
      </div>
    </div>
  );
}