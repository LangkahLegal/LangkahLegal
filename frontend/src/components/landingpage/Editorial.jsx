"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MaterialIcon } from "../ui";

const EDITORIAL_FEATURES = [
  {
    step: "01",
    title: "Edukasi Instan",
    desc: (
      <>
        Pahami hak Anda dengan{" "}
        <strong className="text-main font-semibold">Chatbot AI</strong> sebelum
        melangkah.
      </>
    ),
    icon: "school",
  },
  {
    step: "02",
    title: "Konsultan Berintegritas",
    desc: (
      <>
        Temukan pengacara yang sesuai dengan{" "}
        <strong className="text-main font-semibold">spesialisasi</strong> dan{" "}
        <strong className="text-main font-semibold">anggaran</strong>.
      </>
    ),
    icon: "handshake",
  },
  {
    step: "03",
    title: "Konsultasi Terjadwal",
    desc: (
      <>
        Pertemuan{" "}
        <strong className="text-main font-semibold">virtual dan aman</strong>{" "}
        langsung dari platform.
      </>
    ),
    icon: "event_available",
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
    <section id="about" className="relative w-full z-10 bg-bg overflow-hidden">
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
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-gray-200 text-xs font-bold uppercase tracking-widest mb-4 border border-white/20 backdrop-blur-sm shadow-sm">
              Cara Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-white leading-tight mb-4">
              Mendefinisikan Ulang Konsultasi Hukum
            </h2>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-sm m-0">
              Kami memangkas birokrasi rumit. Dari kebingungan menjadi kejelasan
              hanya dalam tiga langkah.
            </p>

            {/* REFACTOR: Blok Quote Abdullah Azwar Anas */}
            <div className="mt-10 pt-8 border-t border-white/20 max-w-sm">
              <div className="flex items-start gap-4">
                {/* Foto Profil */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-lg">
                  <Image
                    src="/images/anas.jpeg"
                    alt="Abdullah Azwar Anas"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Teks Kutipan */}
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

        {/* KOLOM KANAN: Timeline Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative w-full md:w-1/2 py-12 md:py-16"
        >
          <div className="hidden md:block absolute left-[47px] top-[20px] bottom-[20px] w-px bg-gradient-to-b from-surface via-surface to-transparent" />

          <div className="flex flex-col w-full">
            {EDITORIAL_FEATURES.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative flex gap-5 group px-6 py-5 md:pl-6 md:pr-0 rounded-l-3xl transition-all duration-300 hover:bg-surface/50 cursor-pointer w-full"
              >
                <div className="relative z-10 flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-surface flex items-center justify-center shadow-sm group-hover:border-primary/30 transition-all duration-300 relative z-10">
                    <MaterialIcon
                      name={item.icon}
                      className="text-xl text-primary-light"
                    />
                  </div>
                </div>

                <div className="pt-1 flex-1 pr-6">
                  <div className="text-[10px] md:text-xs font-bold text-primary-light mb-1 tracking-widest uppercase">
                    Langkah {item.step}
                  </div>
                  <h3 className="text-base md:text-lg font-headline font-bold text-main mb-1 group-hover:text-primary-light transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-muted text-xs md:text-sm leading-relaxed transition-colors duration-300 group-hover:text-main m-0">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
