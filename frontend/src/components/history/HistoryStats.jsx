export default function HistoryStats({ count = 0, isLoading = false }) {
  return (
    <div className="flex justify-between items-center px-2">
      <h2 className="text-xl font-bold text-main tracking-tight transition-colors duration-500">
        Sesi Terakhir
      </h2>

      <span className="bg-card text-primary-light text-[10px] font-bold px-4 py-2 rounded-full border border-surface uppercase tracking-widest shadow-lg transition-all duration-500">
        {isLoading ? "..." : `${count ?? 0} Selesai`}
      </span>
    </div>
  );
}
