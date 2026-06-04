"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MaterialIcon } from "../ui";

const EDITORIAL_FEATURES = [
  {
    title: "Edukasi Hukum Instan:",
    desc: "Pahami hak-hak Anda sebelum melangkah lebih jauh dengan bantuan Chatbot AI kami.",
  },
  {
    title: "Matchmaking:",
    desc: "Temukan pengacara yang paling sesuai dengan spesialisasi kasus dan anggaran Anda.",
  },
  {
    title: "Konsultasi Aman & Terjadwal:",
    desc: "Lakukan pertemuan tatap muka virtual dan terjadwal langsung dari platform LangkahLegal.",
  },
];

// Konfigurasi animasi Framer Motion untuk Teks (Slide Up beruntun)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVerticalVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Editorial() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);

  // 1. Auto-Rotate secara Vertikal setiap 5 Detik
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % EDITORIAL_FEATURES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  // 2. Fungsi Pindah Kartu
  const handleNext = () =>
    setActiveIndex((prev) => (prev + 1) % EDITORIAL_FEATURES.length);
  const handlePrev = () =>
    setActiveIndex(
      (prev) =>
        (prev - 1 + EDITORIAL_FEATURES.length) % EDITORIAL_FEATURES.length,
    );

  // 3. Dukungan Swipe Vertikal (Atas/Bawah) untuk Mobile
  const handleTouchStart = (e) => {
    setTouchStartY(e.targetTouches[0].clientY); // Menggunakan clientY (Sumbu Y)
    setIsHovered(true);
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchStartY - touchEndY;

    if (distance > 40) handleNext(); // Swipe ke Atas
    if (distance < -40) handlePrev(); // Swipe ke Bawah

    setIsHovered(false);
  };

  return (
    <section id="about" className="px-6 max-w-7xl mx-auto relative z-10">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Kolom Teks Kiri (Badge & Heading dipindah ke sini) */}
        <motion.div
          variants={itemVerticalVariants}
          className="relative order-1 lg:order-none flex flex-col justify-center"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary-light/20 to-transparent blur-2xl rounded-full pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block px-4 py-2 mt-6 rounded-full bg-primary-light/10 text-primary-light font-bold text-xs uppercase tracking-widest mb-6">
              The Future of Law
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-main leading-tight mb-6 lg:mb-0">
              Mendefinisikan Ulang Cara Anda Berkonsultasi Hukum
            </h2>
          </div>
        </motion.div>

        {/* Kolom Konten Teks Kanan (Tersisa Paragraf & Carousel) */}
        <div className="space-y-8 order-2 lg:order-none flex flex-col pt-4">
          <motion.div variants={itemVerticalVariants}>
            <p className="text-lg text-muted leading-relaxed text-justify">
              Kami memangkas birokrasi yang rumit dan menghilangkan rasa takut
              untuk mencari keadilan. Dari kebingungan menjadi kejelasan hanya
              dalam tiga langkah sederhana:
            </p>
          </motion.div>

          {/* VERTICAL 3D ROTATING CAROUSEL */}
          <motion.div
            variants={itemVerticalVariants}
            className="relative w-full max-w-lg h-[320px] md:h-[280px] flex justify-center items-center mt-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {EDITORIAL_FEATURES.map((item, index) => {
              // Kalkulasi Offset (Posisi Vertikal)
              let offset = index - activeIndex;
              if (offset < -Math.floor(EDITORIAL_FEATURES.length / 2))
                offset += EDITORIAL_FEATURES.length;
              if (offset > Math.floor(EDITORIAL_FEATURES.length / 2))
                offset -= EDITORIAL_FEATURES.length;

              // Logika Kelas Dinamis Berdasarkan Posisi Vertikal
              let stateClasses = "";
              let isClickable = false;

              if (offset === 0) {
                // KARTU TENGAH (Aktif)
                stateClasses =
                  "z-30 scale-100 translate-y-0 opacity-100 shadow-2xl shadow-primary/10 hover:scale-[1.02]";
              } else if (offset === 1) {
                // KARTU BAWAH
                stateClasses =
                  "z-20 scale-[0.9] translate-y-[90px] opacity-40 hover:opacity-80 cursor-pointer blur-[1px] hover:blur-none";
                isClickable = true;
              } else if (offset === -1) {
                // KARTU ATAS
                stateClasses =
                  "z-20 scale-[0.9] -translate-y-[90px] opacity-40 hover:opacity-80 cursor-pointer blur-[1px] hover:blur-none";
                isClickable = true;
              }

              return (
                <div
                  key={index}
                  onClick={() => isClickable && setActiveIndex(index)}
                  className={`absolute w-full bg-input p-6 md:p-8 rounded-[2rem] border border-muted/30 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex items-start gap-4 text-left ${stateClasses}`}
                >
                  <MaterialIcon
                    name="check_circle_outline"
                    className="text-primary-light text-3xl shrink-0 mt-0.5"
                  />
                  <div>
                    <h3 className="text-lg md:text-xl font-headline font-bold text-main mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted text-sm md:text-base leading-relaxed text-justify">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
