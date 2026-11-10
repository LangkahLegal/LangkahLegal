import { MaterialIcon } from "@/components/ui";

/**
 * SearchBar Component
 * @param {string} value - Nilai input saat ini
 * @param {function} onChange - Handler untuk perubahan input
 * @param {string} placeholder - Teks placeholder
 * @param {string} className - Override wrapper class
 * @param {string} inputClassName - Override input class
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Cari keahlian atau nama...",
  className = "",
  inputClassName = "",
  testId = "explore-search-input",
}) {
  return (
    <section className={`w-full transition-all duration-300 ${className}`}>
      <div className="relative group h-full">
        {/* Search Icon Overlay */}
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <MaterialIcon
            name="search"
            className={`text-muted group-focus-within:text-primary group-hover:text-primary-light transition-colors duration-300 ${inputClassName ? '' : 'text-xl'}`}
          />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testId}
          className={`w-full bg-input border border-surface rounded-xl py-3 lg:py-2.5 pl-11 pr-12 text-sm text-main placeholder:text-muted/60 shadow-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/40 transition-all duration-300 ${inputClassName}`}
        />
      </div>
    </section>
  );
}