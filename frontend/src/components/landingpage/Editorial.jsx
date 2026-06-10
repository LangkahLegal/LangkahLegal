"use client";

import { motion } from "framer-motion";
import { MaterialIcon } from "../ui";

const EDITORIAL_FEATURES = [
  {
    step: "01",
    title: "Edukasi Instan",
    desc: (
      <>
        Pahami hak Anda dengan <strong className="text-main font-semibold">Chatbot AI</strong> sebelum melangkah.
      </>
    ),
    icon: "school",
  },
  {
    step: "02",
    title: "Matchmaking Presisi",
    desc: (
      <>
        Temukan pengacara yang sesuai dengan <strong className="text-main font-semibold">spesialisasi</strong> dan <strong className="text-main font-semibold">anggaran</strong>.
      </>
    ),
    icon: "handshake",
  },
  {
    step: "03",
    title: "Konsultasi Terjadwal",
    desc: (
      <>
        Pertemuan <strong className="text-main font-semibold">virtual dan aman</strong> langsung dari platform.
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
    <section id="about" className="px-6 py-16 lg:py-24 max-w-6xl mx-auto relative z-10 bg-bg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        
        {/* Kolom Teks Kiri */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
          }}
          className="relative flex flex-col justify-center"
        >
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-surface text-muted text-xs font-bold uppercase tracking-widest mb-4 border border-surface shadow-sm">
              Cara Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-main leading-tight mb-4">
              Mendefinisikan Ulang Konsultasi Hukum
            </h2>
            <p className="text-sm md:text-base text-muted leading-relaxed mb-6 max-w-sm">
              Kami memangkas birokrasi rumit. Dari kebingungan menjadi kejelasan hanya dalam tiga langkah.
            </p>
          </div>
        </motion.div>

        {/* Kolom Kanan: Timeline Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative"
        >
          {/* Vertical Line for Desktop */}
          <div className="hidden md:block absolute left-[23px] top-[30px] bottom-[30px] w-px bg-gradient-to-b from-surface via-surface to-transparent" />

          <div className="space-y-6 md:space-y-8">
            {EDITORIAL_FEATURES.map((item, index) => (
              <motion.div key={index} variants={itemVariants} className="relative flex gap-5 group">
                
                {/* Icon/Step Indicator */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-surface flex items-center justify-center shadow-sm group-hover:border-primary/30 transition-all duration-300">
                    <MaterialIcon name={item.icon} className="text-xl text-primary-light" />
                  </div>
                </div>

                {/* Content */}
                <div className="pt-1">
                  <div className="text-[10px] md:text-xs font-bold text-primary-light mb-1 tracking-widest uppercase">Langkah {item.step}</div>
                  <h3 className="text-base md:text-lg font-headline font-bold text-main mb-1 group-hover:text-primary-light transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-muted text-xs md:text-sm leading-relaxed max-w-xs">
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
