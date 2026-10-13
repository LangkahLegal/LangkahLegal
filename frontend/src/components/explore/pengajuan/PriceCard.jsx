import { MaterialIcon } from "@/components/ui/Icons";

export default function PriceCard({ price, durationMinutes = 30 }) {
  // --- Safety Check: Mencegah tampilan 'undefined' jika price kosong ---
  const displayPrice = price ?? "0";
  const numPrice =
    typeof price === "number"
      ? price
      : Number(String(price).replace(/\D/g, "")) || 0;

  const sessionCount = Math.max(1, Math.round(durationMinutes / 30));
  const totalPriceFormatted = (numPrice * sessionCount).toLocaleString("id-ID");

  return (
    <div className="w-full bg-card/60 border border-surface rounded-[2.5rem] p-6 sm:p-7 flex justify-between items-center backdrop-blur-xl shadow-2xl transition-colors duration-500">
      <div className="flex-1 min-w-0 ml-2">
        <p className="text-[11px] sm:text-sm font-medium text-muted mb-1 tracking-wide">
          Konsultasi Privat
          {sessionCount > 1
            ? ` (${sessionCount} Sesi · ${durationMinutes} Menit)`
            : ""}
        </p>

        {/* Nominal Harga */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold text-primary-light tracking-tight transition-colors">
            Rp {sessionCount > 1 ? totalPriceFormatted : displayPrice}
          </span>
          <span className="text-xs sm:text-sm font-medium text-muted/80">
            {sessionCount > 1
              ? `(Tarif: Rp ${displayPrice} / 30 Menit)`
              : "/ 30 Menit"}
          </span>
        </div>
      </div>

      <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-primary/15 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center text-primary-light mr-2 border border-primary/10 transition-all duration-300">
        <MaterialIcon name="payments" className="text-2xl sm:text-3xl" />
      </div>
    </div>
  );
}
