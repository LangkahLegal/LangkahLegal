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
            className="text-[#aca8c1] group-focus-within:text-[#6f59fe] group-hover:text-[#ada3ff] transition-colors duration-300 text-2xl"
          />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full bg-[#1f1d35] 
            border border-[#48455a]/50 
            rounded-2xl py-4 pl-14 pr-16 
            text-[#e8e2fc] placeholder:text-[#aca8c1]/60
            focus:outline-none 
            focus:border-[#6f59fe] 
            focus:ring-2 focus:ring-[#6f59fe]/20 
            hover:border-[#48455a]
            transition-all duration-300
            shadow-inner
          "
        />

      </div>
    </section>
  );
}
