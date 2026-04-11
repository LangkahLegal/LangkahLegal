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
            ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
            : "bg-input border-muted/30 hover:bg-card hover:border-muted/50"
        }
      `}
    >
      <MaterialIcon
        name="tune"
        className={`
          text-2xl transition-colors duration-300
          ${
            isActive
              ? "text-primary"
              : "text-muted group-hover:text-primary-light"
          }
        `}
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      />
    </button>
  );
}