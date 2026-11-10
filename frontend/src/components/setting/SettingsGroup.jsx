"use client";

import { useRouter } from "next/navigation";

const ICON_TONE_CLASSES = {
  primary: "bg-primary-soft text-primary",
  secondary: "bg-secondary-soft text-secondary-text",
  success: "bg-success-soft text-success",
  accent: "bg-accent-tint text-accent",
  danger: "bg-danger-soft text-danger",
};

function SettingsItem({ item }) {
  const router = useRouter();
  const isDanger = item.variant === "danger";
  const iconToneClass = isDanger
    ? ICON_TONE_CLASSES.danger
    : ICON_TONE_CLASSES[item.tone] || "bg-surface text-primary";

  const handleClick = () => {
    if (item.onClick) return item.onClick();
    if (item.path) router.push(item.path);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative group cursor-pointer transition-all duration-300
        rounded-2xl border active:scale-[0.98]
        ${
          isDanger
            ? "bg-danger-soft/50 border-danger/20 hover:bg-danger-soft"
            : "bg-card border-surface hover:border-primary/30 shadow-soft"
        }
      `}
    >
      <div className="flex items-center justify-between p-3.5 sm:p-4">
        <div className="flex items-center gap-3.5">
          {/* ICON BOX - Theme Aware */}
          <div
            className={`
              w-10 h-10 flex items-center justify-center rounded-xl 
              transition-all duration-300 group-hover:scale-105
              ${iconToneClass}
            `}
          >
            <span className="material-symbols-outlined text-xl">
              {item.icon}
            </span>
          </div>

          {/* TEXT CONTENT */}
          <div className="flex flex-col gap-0.5">
            <p
              className={`font-bold text-sm tracking-tight ${isDanger ? "text-danger" : "text-main"}`}
            >
              {item.label}
            </p>
            <p
              className={`text-xs font-medium ${isDanger ? "text-danger/60" : "text-muted"}`}
            >
              {item.description}
            </p>
          </div>
        </div>

        {/* CHEVRON */}
        <span
          className={`
            material-symbols-outlined text-xl transition-all duration-300
            group-hover:translate-x-1
            ${isDanger ? "text-danger/40" : "text-muted opacity-50"}
          `}
        >
          chevron_right
        </span>
      </div>
    </div>
  );
}

export default function SettingsGroup({ title, items }) {
  return (
    <section className="space-y-4">
      {/* HEADER SECTION - Sesuai Design System */}
      <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-2">
        {title}
      </h3>

      {/* GRID/STACK ITEMS */}
      <div className="space-y-3">
        {items.map((item) => (
          <SettingsItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
