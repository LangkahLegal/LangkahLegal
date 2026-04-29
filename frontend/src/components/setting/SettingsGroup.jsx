"use client";

import { useRouter } from "next/navigation";

function SettingsItem({ item }) {
  const router = useRouter();
  const isDanger = item.variant === "danger";

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
            ? "bg-danger/5 border-danger/20 hover:bg-danger/10"
            : "bg-card border-surface hover:border-primary/30 shadow-soft"
        }
      `}
    >
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {/* ICON BOX - Theme Aware */}
          <div
            className={`
              w-12 h-12 flex items-center justify-center rounded-xl 
              transition-all duration-300 group-hover:scale-110
              ${
                isDanger
                  ? "bg-danger/20 text-danger"
                  : "bg-surface text-primary-light group-hover:bg-primary/10 group-hover:text-primary"
              }
            `}
          >
            <span className="material-symbols-outlined text-2xl">
              {item.icon}
            </span>
          </div>

          {/* TEXT CONTENT */}
          <div className="flex flex-col gap-0.5">
            <p
              className={`font-bold tracking-tight ${isDanger ? "text-danger" : "text-main"}`}
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
