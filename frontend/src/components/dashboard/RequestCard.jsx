// components/dashboard/RequestCard.jsx
import { MaterialIcon } from "@/components/ui";

export default function RequestCard({ name, time, avatar, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-card bg-input border border-white/5 p-5 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group"
    >
      {/* Profile Section */}
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden group-hover:bg-primary-light/20 transition-colors border border-white/5">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <MaterialIcon name="person" className="text-primary-light text-2xl" />
        )}
      </div>

      {/* Text Info Section */}
      <div className="flex-1">
        <h4 className="font-bold text-main text-sm mb-0.5">{name}</h4>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted font-medium">{time}</p>
        </div>
      </div>

      {/* Action Icon */}
      <MaterialIcon
        name="chevron_right"
        className="text-muted group-hover:translate-x-1 transition-transform"
      />
    </div>
  );
}
