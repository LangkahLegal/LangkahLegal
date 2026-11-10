import { MaterialIcon } from "@/components/ui";
import Link from "next/link";

export default function EmptyConsultationCard() {
  return (
    <section className="bg-card border border-surface shadow-soft p-5 lg:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 lg:gap-8 relative overflow-hidden group">
      {/* Glow Effect Samping (Opsional untuk estetika) */}
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-5 flex-1">
        {/* Icon Container - Tetap Proporsional */}
        <div className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl bg-input flex items-center justify-center border border-surface shadow-inner transition-transform group-hover:scale-105 duration-300">
          <MaterialIcon
            name="event_busy"
            className="text-2xl lg:text-3xl text-primary"
          />
        </div>

        {/* Text Content - Rata kiri di Desktop, Tengah di Mobile */}
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-base lg:text-lg font-headline font-bold text-main">
            Belum Ada Konsultasi Aktif
          </h3>
          <p className="text-xs lg:text-sm text-muted max-w-md leading-relaxed font-sans">
            Butuh bantuan hukum? Temukan konsultan yang tepat untuk masalah Anda
            sekarang melalui katalog kami.
          </p>
        </div>
      </div>

      {/* Search Button - Lebar penuh di mobile, Otomatis di desktop */}
      <Link
        href="/explore"
        className="w-full md:w-auto md:min-w-[160px] bg-primary-light hover:bg-primary text-bg py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-primary-light/20 active:scale-95"
      >
        <MaterialIcon name="search" className="text-lg" />
        <span className="whitespace-nowrap">Cari Konsultan</span>
      </Link>
    </section>
  );
}