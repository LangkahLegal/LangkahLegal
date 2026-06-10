"use client";

import { motion } from "framer-motion";
import { MaterialIcon } from "../ui";

const FEATURES = [
  {
    title: "AI Hukum Instan",
    icon: "smart_toy",
    desc: (
      <>
        Ceritakan masalah dengan bahasa biasa. <strong className="text-main font-semibold">AI kami</strong> akan mencarikan pasal yang tepat dalam detik.
      </>
    ),
    iconColor: "text-primary-light",
    iconBg: "bg-primary-light/10",
  },
  {
    title: "Bursa Kasus Anonim",
    icon: "privacy_tip",
    desc: (
      <>
        Posting ringkasan kasus secara <strong className="text-main font-semibold">anonim</strong>. Biarkan pengacara yang menawarkan bantuan ke Anda.
      </>
    ),
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    title: "Bantuan Pro-Bono",
    icon: "account_balance_wallet",
    desc: (
      <>
        Gunakan filter khusus kami untuk menemukan layanan bantuan hukum <strong className="text-main font-semibold">cuma-cuma</strong>.
      </>
    ),
    iconColor: "text-primary-dark",
    iconBg: "bg-primary/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="px-6 py-16 lg:py-24 relative z-10 overflow-hidden bg-surface">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.h2 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={itemVariants}
            className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-main leading-tight mb-4"
          >
            Kenapa LangkahLegal?
          </motion.h2>
          <motion.p 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={itemVariants}
            className="text-sm md:text-base text-muted max-w-xl mx-auto leading-relaxed"
          >
            Kami mendigitalisasi proses bantuan hukum agar lebih mudah
            diakses, menjaga privasi, dan transparan.
          </motion.p>
        </div>

        {/* 3-Column Simple Grid Layout */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {FEATURES.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative bg-bg p-6 lg:p-8 rounded-2xl border border-surface transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}>
                <MaterialIcon
                  name={item.icon}
                  className={`text-2xl ${item.iconColor}`}
                />
              </div>
              <h3 className="text-lg md:text-xl font-headline font-bold text-main mb-3">
                {item.title}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}