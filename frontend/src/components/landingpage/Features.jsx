"use client";

import { motion } from "framer-motion";
import { MaterialIcon } from "../ui";

// Menggunakan deskripsi paragraf agar mirip dengan format testimonial di gambar
const FEATURES = [
  {
    title: "AI Hukum Instan",
    icon: "smart_toy",
    desc: "Ceritakan masalah dengan bahasa biasa. AI kami akan otomatis menerjemahkannya dan mencarikan pasal yang tepat dalam hitungan detik. Cepat dan akurat.",
    iconColor: "text-primary-light",
    iconBg: "bg-primary-light/10",
  },
  {
    title: "Bursa Kasus Anonim",
    icon: "privacy_tip",
    desc: "Posting ringkasan kasus secara anonim. Privasi 100% aman. Biarkan para pengacara berkompeten yang menawarkan bantuan dan solusi langsung ke Anda.",
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
  {
    title: "Bantuan Pro-Bono",
    icon: "account_balance_wallet",
    desc: "Semua berhak mendapatkan ahli hukum yang layak. Gunakan filter khusus kami untuk menemukan layanan bantuan hukum cuma-cuma (gratis) di sekitar Anda.",
    iconColor: "text-danger",
    iconBg: "bg-danger/10",
  },
];

// Menggandakan array beberapa kali agar panjangnya cukup untuk efek infinite scroll
const MARQUEE_ITEMS = [...FEATURES, ...FEATURES, ...FEATURES, ...FEATURES];

export default function Features() {
  return (
    <section
      id="features"
      // Lebar penuh (w-full) dan overflow-hidden agar scroll tidak merusak layout
      className="relative w-full py-16 lg:py-24 z-10 bg-bg overflow-hidden"
    >
      {/* Header Tetap di Tengah */}
      <div className="max-w-6xl mx-auto px-6 text-center mb-12 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-main leading-tight mb-4">
          Kenapa LangkahLegal?
        </h2>
        <p className="text-sm md:text-base text-muted max-w-xl mx-auto leading-relaxed">
          Kami mendigitalisasi proses bantuan hukum agar lebih mudah diakses,
          menjaga privasi, dan transparan untuk semua kalangan.
        </p>
      </div>

      {/* Area Marquee Full Width */}
      <div className="relative flex w-full overflow-hidden">
        {/* Efek Gradasi (Fade) di Kiri & Kanan Layar agar kartu muncul/hilang dengan halus */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-6 w-max px-6"
          // Animasi dari X: 0% menuju -50%
          // Karena kita punya 4 set data (MARQUEE_ITEMS), bergeser -50% berarti bergeser tepat 2 set,
          // sehingga looping-nya akan terlihat mulus (seamless)
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 35, // Semakin besar angka, semakin lambat scroll-nya
          }}
        >
          {MARQUEE_ITEMS.map((item, index) => (
            <div
              key={index}
              // Desain Kartu (Sesuai referensi gambar: gelap, rounded, border tipis)
              className="w-[300px] md:w-[380px] bg-card border border-surface p-6 md:p-8 rounded-[1.5rem] flex-shrink-0 transition-colors duration-300 hover:bg-surface/30 cursor-grab active:cursor-grabbing"
            >
              {/* Bagian Atas Kartu: Avatar/Ikon + Judul */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${item.iconBg}`}
                >
                  <MaterialIcon
                    name={item.icon}
                    className={`text-[22px] ${item.iconColor}`}
                  />
                </div>
                <h3 className="text-base md:text-lg font-headline font-bold text-main m-0">
                  {item.title}
                </h3>
              </div>

              {/* Bagian Bawah Kartu: Teks Deskripsi */}
              <p className="text-sm md:text-base text-muted leading-relaxed m-0">
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
