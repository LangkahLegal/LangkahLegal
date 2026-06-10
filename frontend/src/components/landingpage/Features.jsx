"use client";

import { motion } from "framer-motion";
import { MaterialIcon } from "../ui";

const FEATURES = [
  {
    title: "Triase Hukum Berbasis AI",
    icon: "smart_toy",
    desc: (
      <>
        Tidak paham pasal? Ceritakan masalah Anda dengan bahasa sehari-hari. <strong className="text-main font-semibold">AI cerdas kami</strong> akan menerjemahkannya ke ranah hukum yang tepat dalam hitungan detik.
      </>
    ),
    colSpan: "md:col-span-2",
    bgClass: "bg-gradient-to-br from-input to-input/50",
    iconColor: "text-primary-light",
    iconBg: "bg-primary-light/10",
  },
  {
    title: "Privasi & Bursa Kasus Anonim",
    icon: "privacy_tip",
    desc: (
      <>
        Lindungi identitas Anda. Posting ringkasan kasus secara <strong className="text-main font-semibold">anonim</strong>, dan biarkan konsultan hukum memberikan penawaran bantuan.
      </>
    ),
    colSpan: "col-span-1",
    bgClass: "bg-input",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
  },
  {
    title: "Transparan & Opsi Pro-Bono",
    icon: "account_balance_wallet",
    desc: (
      <>
        Nikmati pembayaran yang terintegrasi. Tersedia filter khusus untuk menemukan bantuan hukum <strong className="text-main font-semibold">cuma-cuma (Pro-Bono)</strong>.
      </>
    ),
    colSpan: "col-span-1",
    bgClass: "bg-input",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
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
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="px-6 py-24 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.h2 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-main leading-tight mb-6"
          >
            Kenapa LangkahLegal?
          </motion.h2>
          <motion.p 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={itemVariants}
            className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed"
          >
            Kami mendigitalisasi proses bantuan hukum agar lebih mudah
            diakses, menjaga privasi Anda, dan transparan dalam setiap
            prosesnya.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {FEATURES.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`group relative overflow-hidden p-8 md:p-10 rounded-[2rem] border border-surface transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.1)] ${item.colSpan} ${item.bgClass} backdrop-blur-xl`}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${item.iconBg}`}>
                    <MaterialIcon
                      name={item.icon}
                      className={`text-3xl ${item.iconColor}`}
                    />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-headline font-bold text-main mb-4 leading-snug">
                    {item.title}
                  </h3>
                </div>
                <p className="text-muted text-base md:text-lg leading-relaxed text-justify mt-2">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}