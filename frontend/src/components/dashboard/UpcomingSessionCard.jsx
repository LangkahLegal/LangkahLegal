export default function UpcomingSessionCard({ name, caseType, dateLabel, time }) {
  return (
    <div className="glass-card bg-input border border-white/5 p-5 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 grayscale">
          <img
            src="/api/placeholder/48/48"
            className="w-full h-full object-cover rounded-xl"
            alt="client"
          />
        </div>
        <div>
          <h4 className="font-bold text-main text-sm">{name}</h4>
          <p className="text-xs text-muted">{caseType}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="px-2 py-1 rounded-md bg-white/5 text-xs font-bold text-muted mb-1 uppercase tracking-wider">
          {dateLabel}
        </div>
        <p className="text-xs font-bold text-main">{time}</p>
      </div>
    </div>
  );
}