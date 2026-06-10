"use client";

import { motion } from "framer-motion";
import { MaterialIcon } from "../ui";

const EDITORIAL_FEATURES = [
  {
    step: "01",
    title: "Edukasi Hukum Instan",
    desc: (
      <>
        Pahami hak-hak Anda dengan bantuan <strong className="text-main font-semibold">Chatbot AI</strong> sebelum melangkah lebih jauh.
      </>
    ),
    icon: "school",
  },
  {
    step: "02",
    title: "Matchmaking Presisi",
    desc: (
      <>
        Temukan pengacara yang paling sesuai dengan <strong className="text-main font-semibold">spesialisasi kasus</strong> dan <strong className="text-main font-semibold">anggaran</strong> Anda.
      </>
    ),
    icon: "handshake",
  },
  {
    step: "03",
    title: "Konsultasi Terjadwal",
    desc: (
      <>
        Lakukan pertemuan tatap muka <strong className="text-main font-semibold">virtual dan aman</strong> langsung dari platform LangkahLegal.
      </>
    ),
    icon: "event_available",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Editorial() {
  return (
    <section id="about" className="px-6 py-20 max-w-7xl mx-auto relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* Kolom Teks Kiri */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
          }}
          className="relative flex flex-col justify-center"
        >
          {/* Decorative Blur */}
          <div className="absolute -inset-10 bg-gradient-to-tr from-primary-light/10 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

          <div className="relative z-10">
            <span className="inline-block px-4 py-2 rounded-full bg-surface text-muted text-xs font-bold uppercase tracking-widest mb-6 border border-surface shadow-sm">
              Cara Kerja
            </span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-main leading-tight mb-6">
              Mendefinisikan Ulang Cara Anda Berkonsultasi Hukum
            </h2>
            <p className="text-lg text-muted leading-relaxed text-justify mb-8">
              Kami memangkas birokrasi yang rumit dan menghilangkan rasa takut
              untuk mencari keadilan. Dari kebingungan menjadi kejelasan hanya
              dalam tiga langkah sederhana:
            </p>
          </div>
        </motion.div>

        {/* Kolom Kanan: Timeline Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {/* Vertical Line for Desktop */}
          <div className="hidden md:block absolute left-[27px] top-[40px] bottom-[40px] w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

          <div className="space-y-8 md:space-y-12">
            {EDITORIAL_FEATURES.map((item, index) => (
              <motion.div key={index} variants={itemVariants} className="relative flex gap-6 md:gap-8 group">
                
                {/* Icon/Step Indicator */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-input border border-surface flex items-center justify-center shadow-lg group-hover:border-primary/50 group-hover:bg-primary/5 transition-all duration-300">
                    <MaterialIcon name={item.icon} className="text-2xl text-primary-light" />
                  </div>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-primary-light mb-1 tracking-widest uppercase">Langkah {item.step}</div>
                  <h3 className="text-xl md:text-2xl font-headline font-bold text-main mb-2 group-hover:text-primary-light transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-muted text-base md:text-lg leading-relaxed text-justify">
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
