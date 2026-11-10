"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const PROCESS_STEPS = [
  {
    title: "Ceritakan situasi Anda",
    desc: "Sampaikan kronologi dengan bahasa sehari-hari untuk memahami gambaran awal masalah.",
  },
  {
    title: "Pilih jalur pendampingan",
    desc: "Tentukan sendiri antara memilih konsultan langsung atau mengunggah kasus anonim di Bursa.",
  },
  {
    title: "Konsultasi secara privat",
    desc: "Ikuti pertemuan virtual terjadwal langsung dari platform dengan aman.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Editorial() {
  return (
    <section
      id="about"
      className="relative w-full z-10 bg-bg overflow-hidden scroll-mt-[calc(4.5rem+1px)] md:scroll-mt-[calc(5rem+1px)]"
    >
      <div className="flex flex-col md:flex-row items-stretch w-full">
        {/* KOLOM KIRI */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="relative w-full md:w-1/2 flex flex-col justify-center px-6 md:pl-16 lg:pl-32 py-16 overflow-hidden"
        >
          <Image
            src="/images/bg_editorial.jpg"
            alt="LangkahLegal Cara Kerja"
            fill
            className="object-cover object-center z-0"
          />
          <div className="absolute inset-0 bg-black/70 z-0" />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-white leading-tight mb-4">
              Mendefinisikan Ulang Konsultasi Hukum
            </h2>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-sm m-0">
              Kami memangkas kerumitan birokrasi agar akses keadilan terasa lebih
              sederhana.
            </p>

            <div className="mt-8 max-w-sm">
              <div className="flex items-start gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src="/images/anas.jpeg"
                    alt="Abdullah Azwar Anas"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm italic text-gray-300 mb-2 leading-relaxed">
                    &quot;Birokrasi harus berdampak, birokrasi tidak boleh lagi
                    berbelit-belit dengan tumpukan kertas.&quot;
                  </p>
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    — Abdullah Azwar Anas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KOLOM KANAN: Alur Singkat */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 md:py-16"
        >
          <div className="flex flex-col gap-6 max-w-lg">
            {PROCESS_STEPS.map((item, index) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="p-4 rounded-2xl transition-colors duration-300 hover:bg-surface/50"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-sm font-bold text-primary-text shrink-0">
                    {index + 1}.
                  </span>
                  <div>
                    <h3 className="text-base md:text-lg font-headline font-bold text-main mb-1">
                      {item.title}
                    </h3>
                    <p className="text-muted text-xs md:text-sm leading-relaxed m-0">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
