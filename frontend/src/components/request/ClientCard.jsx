import { MaterialIcon } from "@/components/ui/Icons";

export default function ClientCard({ name, timeAgo, avatar }) {
  return (
    <section className="bg-[#1f1d35] p-6 rounded-[32px] border border-white/5 flex items-center gap-5">
      {/* Profile Section */}
      <div className="w-24 h-20 rounded-2xl bg-[#0e0c1e] flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <MaterialIcon name="person" className="text-3xl text-[#6f59fe]" />
        )}
      </div>

      {/* Info Section */}
      <div>
        <h2 className="text-xl font-bold text-white leading-tight">{name}</h2>
        <div className="flex items-center gap-1.5 text-[#aca8c1] mt-1">
          <MaterialIcon name="schedule" className="text-sm" />
          <span className="text-xs font-medium">{timeAgo}</span>
        </div>
      </div>
    </section>
  );
}
