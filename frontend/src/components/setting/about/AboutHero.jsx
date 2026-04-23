export default function AboutHero() {
  return (
    <div className="relative pb-8 pt-4">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#6f59fe]/20 rounded-full blur-[90px] -z-10 pointer-events-none" />
      
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ada3ff]" />
        <span className="text-[10px] lg:text-xs font-bold tracking-widest text-[#ada3ff] uppercase">
          Our Vision
        </span>
      </div>

      <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-6">
        Mendigitalisasi <br className="hidden md:block" />
        akses hukum <span className="text-[#ada3ff]">untuk semua.</span>
      </h1>
      <p className="text-[#aca8c1] text-base lg:text-lg leading-relaxed max-w-xl">
        Kami percaya setiap warga negara berhak atas bantuan hukum yang setara, cepat, dan terpercaya melalui teknologi.
      </p>
    </div>
  );
}