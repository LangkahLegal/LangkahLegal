import { MaterialIcon } from "@/components/ui";

export default function StatCard({ label, val, icon, variant = "default" }) {
  const isHorizontal = variant === "horizontal";

  const containerClass = isHorizontal
    ? "flex flex-row items-center gap-4 p-4 bg-input border border-white/5 rounded-3xl hover:border-white/10 transition-all cursor-default"
    : "bg-input border border-white/5 p-6 rounded-3xl space-y-4 hover:border-white/10 transition-all cursor-default";

  const iconContainerClass = isHorizontal
    ? "w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"
    : "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center";

  const contentClass = isHorizontal
    ? "flex flex-col"
    : "";

  const valueClass = isHorizontal
    ? "text-2xl font-headline font-bold text-main"
    : "text-3xl font-headline font-bold text-main";

  return (
    <div className={containerClass}>
      <div className={iconContainerClass}>
        <MaterialIcon name={icon} className="text-muted" />
      </div>
      <div className={contentClass}>
        <h3 className={valueClass}>{val}</h3>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}