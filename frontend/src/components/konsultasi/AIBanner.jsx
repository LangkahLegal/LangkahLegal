import { MaterialIcon } from "@/components/ui";

export default function AIBanner({ onAction }) {
  return (
    <section className="w-full">
      <div
        className="relative overflow-hidden bg-[#8470ff] p-8 lg:p-12 rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10 transition-all duration-500"
      >
        {/* Konten Teks: Fluid di desktop */}
        <div className="space-y-4 z-10 relative">
          {/* JUDUL: Kita perlebar max-w di desktop agar memanjang ke samping */}
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold text-[#0e0c1e] leading-[1.1] tracking-tight/* Mobile: max-w-xs (320px) agar memeluk judul, Desktop: max-w-lg (512px) agar memanjang */max-w-xs sm:max-w-sm lg:max-w-lg">
            Konsultasi AI Tersedia 24/7
          </h2>

          {/* DESKRIPSI: Kita perlebar max-w secara drastis di desktop agar tidak kaku */}
          <p
            className="text-[#0e0c1e]/70 text-sm sm:text-base lg:text-lg leading-relaxed font-medium/* Mobile: max-w-xs (320px) agar rapi, Desktop: max-w-2xl (672px) agar memanjang */max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
            Dapatkan jawaban hukum instan sebelum bicara dengan pakar.
          </p>

          <div className="pt-4 lg:pt-2">
            <button
              onClick={onAction}
              className="bg-[#0e0c1e] text-white px-10 py-4 rounded-full font-bold text-sm lg:text-bas hover:scale-105 transition-all active:scale-95 shadow-lg shadow-[#0e0c1e]/2 w-full sm:w-auto">
              Coba Sekarang
            </button>
          </div>
        </div>

        {/* --- ICON DEKORATIF (STAY AS IS) --- */}
        <div className="absolute -bottom-10 -right-6 opacity-20 pointer-events-none rotate-12">
          <MaterialIcon
            name="auto_awesome"
            className="text-[14rem] lg:text-[18rem] text-white"
          />
        </div>

        <div className="absolute top-8 right-20 opacity-10 pointer-events-none">
          <MaterialIcon name="star" className="text-4xl text-white" />
        </div>
      </div>
    </section>
  );
}
