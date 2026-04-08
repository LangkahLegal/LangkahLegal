import { MaterialIcon } from "@/components/ui/Icons";

/**
 * Filter Component
 * @param {function} onClick 
 * @param {boolean} isActive
 */
export default function Filter({ onClick, isActive = false }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`
        w-14 h-14 lg:w-[60px] lg:h-[60px]
        flex items-center justify-center shrink-0
        rounded-2xl border transition-all duration-300 group
        ${
          isActive
            ? "bg-[#6f59fe]/20 border-[#6f59fe] shadow-[0_0_15px_rgba(111,89,254,0.2)]"
            : "bg-[#1f1d35] border-[#48455a]/50 hover:bg-[#2a2745] hover:border-[#48455a]"
        }
      `}
    >
      <MaterialIcon
        name="tune"
        className={`
          text-2xl transition-colors duration-300
          ${
            isActive
              ? "text-[#6f59fe]"
              : "text-[#aca8c1] group-hover:text-[#ada3ff]"
          }
        `}
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      />
    </button>
  );
}
