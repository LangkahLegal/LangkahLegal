export default function HistoryStats({ count }) {
  return (
    <div className="flex justify-between items-center px-2">
      <h2 className="text-xl font-bold text-white tracking-tight">
        Sesi Terakhir
      </h2>
      <span className="bg-[#1f1d35] text-[#ada3ff] text-[10px] font-bold px-4 py-2 rounded-full border border-white/5 uppercase tracking-widest shadow-lg">
        {count} Selesai
      </span>
    </div>
  );
}
