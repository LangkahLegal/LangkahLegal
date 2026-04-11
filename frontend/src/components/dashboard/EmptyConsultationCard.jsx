import { MaterialIcon } from "@/components/ui";
import Link from "next/link";

export default function EmptyConsultationCard() {
  return (
    <section className="bg-card border border-muted/30 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-10 relative overflow-hidden group">
      {/* Glow Effect Samping (Opsional untuk estetika) */}
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
        {/* Icon Container - Tetap Proporsional */}
        <div className="w-16 h-16 lg:w-20 lg:h-20 shrink-0 rounded-2xl bg-input flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-300">
          <MaterialIcon
            name="event_busy"
            className="text-3xl lg:text-4xl text-primary-light"
          />
        </div>

        {/* Text Content - Rata kiri di Desktop, Tengah di Mobile */}
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xl lg:text-2xl font-headline font-bold text-main">
            Belum Ada Konsultasi Aktif
          </h3>
          <p className="text-sm text-muted max-w-md leading-relaxed font-sans">
            Butuh bantuan hukum? Temukan konsultan yang tepat untuk masalah Anda
            sekarang melalui katalog kami.
          </p>
        </div>
      </div>

      {/* Search Button - Lebar penuh di mobile, Otomatis di desktop */}
      <Link
        href="/konsultasi"
        className="w-full md:w-auto md:min-w-[180px] bg-primary-light hover:bg-primary text-dark py-3.5 lg:py-4 px-8 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-lg shadow-primary-light/20 active:scale-95"
      >
        <MaterialIcon name="search" className="text-2xl" />
        <span className="whitespace-nowrap">Cari Konsultan</span>
      </Link>
    </section>
  );
}