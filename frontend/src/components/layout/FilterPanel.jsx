"use client";

import PillDropdown from "@/components/ui/PillDropdown";
import { MaterialIcon } from "@/components/ui/Icons";

/**
 * Judul "Filter", tombol Reset, dan grid dropdown filter.
 * @param {Array} dropdowns - [{ key, icon, options, wide }]; `wide` membuat dropdown selebar dua kolom di mobile.
 * @param {object} values - Nilai terpilih per `key`.
 * @param {function} onChange - Dipanggil dengan (key, value).
 * @param {function} onReset - Mengembalikan semua filter ke nilai awal.
 * @param {boolean} canReset - Ada filter atau pencarian yang sedang aktif.
 * @param {string} gridClassName - Jumlah kolom grid di layar lebar.
 * @param {string} testIdPrefix - Awalan data-testid tombol reset dan tiap dropdown (`<prefix>-filter-<key>`).
 * @param {React.ReactNode} children - Kontrol tambahan di dalam grid setelah dropdown (mis. rentang harga).
 */
export default function FilterPanel({
  dropdowns,
  values,
  onChange,
  onReset,
  canReset,
  gridClassName = "lg:grid-cols-4",
  testIdPrefix = "filter",
  children,
}) {
  return (
    <section className="space-y-3 px-1 relative z-20">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
          Filter
        </h3>
        <button
          onClick={onReset}
          disabled={!canReset}
          data-testid={`${testIdPrefix}-reset-filter`}
          className="flex items-center gap-1 text-xs font-bold text-danger disabled:text-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MaterialIcon name="restart_alt" className="text-sm" />
          Reset Filter
        </button>
      </div>

      <div className={`grid grid-cols-2 ${gridClassName} gap-2.5`}>
        {dropdowns.map(({ key, icon, wide, options }) => (
          <div key={key} className={wide ? "col-span-2 lg:col-span-1" : ""}>
            <PillDropdown
              icon={icon}
              options={options}
              value={values[key]}
              onChange={(value) => onChange(key, value)}
              fullWidth
              testId={`${testIdPrefix}-filter-${key}`}
            />
          </div>
        ))}
        {children}
      </div>
    </section>
  );
}
