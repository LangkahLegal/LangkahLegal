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
      className={`rounded-2xl group cursor-pointer transition-all duration-300 ${
        isDanger
          ? "bg-[#a70138]/5 hover:bg-[#a70138]/10 border border-[#a70138]/10"
          : "bg-[#131125] hover:bg-[#2c2945]"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className={`w-11 h-11 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300 ${
              isDanger
                ? "bg-[#a70138]/20 text-[#ff6e84]"
                : "bg-[#25233d] text-[#ada3ff]"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </div>

          {/* Text */}
          <div>
            <p className={`font-semibold ${isDanger ? "text-[#ff6e84]" : "text-[#e8e2fc]"}`}>
              {item.label}
            </p>
            <p className={`text-xs ${isDanger ? "text-[#ff6e84]/60" : "text-[#aca8c1]"}`}>
              {item.description}
            </p>
          </div>
        </div>

        {/* Chevron */}
        <span
          className={`material-symbols-outlined opacity-50 group-hover:translate-x-1 transition-transform ${
            isDanger ? "text-[#ff6e84]/40" : "text-[#aca8c1]"
          }`}
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
      <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] px-2">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <SettingsItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}