import { MaterialIcon } from "@/components/ui";

/**
 * SearchBar Component
 * @param {string} value - Nilai input saat ini
 * @param {function} onChange - Handler untuk perubahan input
 * @param {string} placeholder - Teks placeholder
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Cari keahlian atau nama...",
}) {
  return (
    <section className="w-full transition-all duration-300">
      <div className="relative group">
        {/* Search Icon Overlay */}
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <MaterialIcon
            name="search"
            className="text-muted group-focus-within:text-primary group-hover:text-primary-light transition-colors duration-300 text-2xl"
          />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-input border border-muted/30 rounded-2xl py-4 pl-14 pr-16 text-main placeholder:text-muted/6 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-muted/5 transition-all duration-30 shadow-inner"
        />
      </div>
    </section>
  );
}