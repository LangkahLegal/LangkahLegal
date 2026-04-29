import { MaterialIcon } from "@/components/ui/Icons";

export default function PriceCard({ price }) {
  // --- Safety Check: Mencegah tampilan 'undefined' jika price kosong ---
  const displayPrice = price ?? "0";

  return (
    /* REFACTOR: 
       bg-[#1f1d35]/60 -> bg-card/60 
       border-white/5  -> border-surface 
    */
    <div className="w-full bg-card/60 border border-surface rounded-[2.5rem] p-6 sm:p-7 flex justify-between items-center backdrop-blur-xl shadow-2xl transition-colors duration-500">
      <div className="flex-1 min-w-0 ml-2">
        {/* Label Atas - REFACTOR: text-[#aca8c1] -> text-muted */}
        <p className="text-[11px] sm:text-sm font-medium text-muted mb-1 tracking-wide">
          Konsultasi Privat
        </p>

        {/* Nominal Harga */}
        <div className="flex items-baseline gap-1.5">
          {/* REFACTOR: text-[#ada3ff] -> text-primary-light */}
          <span className="text-2xl sm:text-3xl font-extrabold text-primary-light tracking-tight transition-colors">
            Rp {displayPrice}
          </span>
          {/* REFACTOR: text-[#aca8c1]/80 -> text-muted/80 */}
          <span className="text-xs sm:text-sm font-medium text-muted/80">
            / 30 Menit
          </span>
        </div>
      </div>

      <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-primary/15 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center text-primary-light mr-2 border border-primary/10 transition-all duration-300">
        <MaterialIcon name="payments" className="text-2xl sm:text-3xl" />
      </div>
    </div>
  );
}
