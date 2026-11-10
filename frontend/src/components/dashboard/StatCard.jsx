import { MaterialIcon } from "@/components/ui";

const TONE_STYLES = {
  default: {
    container: "bg-card border-surface hover:border-primary/25 shadow-soft",
    tile: "bg-surface text-muted",
  },
  primary: {
    container: "bg-card border-primary/20 hover:border-primary/40 shadow-soft",
    tile: "bg-primary-soft text-primary-text",
  },
  secondary: {
    container: "bg-card border-secondary/20 hover:border-secondary/40 shadow-soft",
    tile: "bg-secondary-soft text-secondary-text",
  },
  info: {
    container: "bg-card border-info/20 hover:border-info/40 shadow-soft",
    tile: "bg-info-soft text-info-text",
  },
  sage: {
    container: "bg-card border-sage/20 hover:border-sage/40 shadow-soft",
    tile: "bg-sage-soft text-sage-text",
  },
};

export default function StatCard({
  label,
  val,
  icon,
  variant = "default",
  tone,
}) {
  const isHorizontal = variant === "horizontal";
  const resolvedTone =
    tone || (variant !== "horizontal" ? variant : "default");
  const styles = TONE_STYLES[resolvedTone] || TONE_STYLES.default;

  const containerClass = isHorizontal
    ? `flex flex-row items-center gap-3.5 p-4 border rounded-2xl transition-all cursor-default ${styles.container}`
    : `border p-4 lg:p-5 rounded-2xl space-y-2.5 h-full flex flex-col justify-between transition-all cursor-default ${styles.container}`;

  const iconContainerClass = isHorizontal
    ? `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.tile}`
    : `w-9 h-9 rounded-xl flex items-center justify-center ${styles.tile}`;

  const contentClass = isHorizontal ? "flex flex-col" : "";

  const valueClass = isHorizontal
    ? "text-xl font-headline font-bold text-main"
    : "text-2xl font-headline font-bold text-main";

  return (
    <div className={containerClass}>
      <div className={iconContainerClass}>
        <MaterialIcon name={icon} />
      </div>
      <div className={contentClass}>
        <h3 className={valueClass}>{val}</h3>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}