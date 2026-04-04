import { Button, MaterialIcon } from "@/components/ui";

export default function ConsultantCard({ consultant }) {
  const { name, spec, rating, reviews, status, avatar } = consultant;

  return (
    <div className="glass-card bg-[#1f1d35]/60 border border-[#48455a]/30 p-5 rounded-3xl flex items-center justify-between group hover:border-[#ada3ff]/40 transition-all duration-300 shadow-lg">
      <div className="flex items-center gap-5">
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0c1e]">
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1f1d35] ${
              status === "online"
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-zinc-500"
            }`}
          />
        </div>

        {/* Details */}
        <div className="space-y-1">
          <h3 className="font-headline font-bold text-[#e8e2fc] lg:text-lg">
            {name}
          </h3>
          <p className="text-[#ada3ff] text-xs lg:text-sm font-medium">
            {spec}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#aca8c1]">
            <MaterialIcon
              name="star"
              className="text-amber-400 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            />
            <span className="font-bold text-[#e8e2fc]">{rating}</span>
            <span>({reviews})</span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        className="!px-6 !py-2.5 text-sm !rounded-xl !bg-white/5 border-white/10 hover:!bg-[#6f59fe] hover:!text-white transition-all"
      >
        Lihat
      </Button>
    </div>
  );
}
