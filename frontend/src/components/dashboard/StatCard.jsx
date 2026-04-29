import { MaterialIcon } from "@/components/ui";

export default function StatCard({ label, val, icon }) {
  return (
    <div className=" bg-input border border-white/5 p-6 rounded-3xl space-y-4 hover:border-white/10 transition-all cursor-default">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <MaterialIcon name={icon} className="text-muted" />
      </div>
      <div>
        <h3 className="text-3xl font-headline font-bold text-main">{val}</h3>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}