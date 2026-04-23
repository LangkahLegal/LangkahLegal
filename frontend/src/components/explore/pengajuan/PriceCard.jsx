import { MaterialIcon } from "@/components/ui/Icons";

export default function PriceCard({ price }) {
  return (
    <div className="w-full bg-[#1f1d35]/60 border border-white/5 rounded-[2.5rem] p-6 sm:p-7 flex justify-between items-center backdrop-blur-xl shadow-2xl">
      <div className="flex-1 min-w-0 ml-2">
        {/* Label Atas */}
        <p className="text-[11px] sm:text-sm font-medium text-[#aca8c1] mb-1 tracking-wide">
          Konsultasi Privat
        </p>

        {/* Nominal Harga */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#ada3ff] tracking-tight">
            Rp {price}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#aca8c1]/80">
            / 30 Menit
          </span>
        </div>
      </div>

      {/* Ikon Box di Sebelah Kanan */}
      <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[#6f59fe]/15 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center text-[#ada3ff] mr-2 border border-[#6f59fe]/10">
        <MaterialIcon name="payments" className="text-2xl sm:text-3xl" />
      </div>
    </div>
  );
}
