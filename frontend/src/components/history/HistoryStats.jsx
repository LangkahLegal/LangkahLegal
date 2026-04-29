export default function HistoryStats({ count = 0 }) {
  return (
    <div className="flex justify-between items-center px-2">
      {/* REFACTOR: text-white -> text-main agar otomatis gelap di light mode */}
      <h2 className="text-xl font-bold text-main tracking-tight transition-colors duration-500">
        Sesi Terakhir
      </h2>

      {/* REFACTOR: 
          bg-[#1f1d35]    -> bg-card
          text-[#ada3ff]  -> text-primary-light
          border-white/5  -> border-surface
      */}
      <span className="bg-card text-primary-light text-[10px] font-bold px-4 py-2 rounded-full border border-surface uppercase tracking-widest shadow-lg transition-all duration-500">
        {count ?? 0} Selesai
      </span>
    </div>
  );
}
