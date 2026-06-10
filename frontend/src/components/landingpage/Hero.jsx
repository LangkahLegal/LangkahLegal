"use client";

import { motion } from "framer-motion";
import { Button, MaterialIcon } from "../ui";

// Animasi Fade Up
const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.8, 0.25, 1] },
  },
};

export default function Hero({ onGetStarted, onLearnMore }) {
  return (
    <section
      id="hero"
      className="relative px-6 py-20 lg:py-32 w-full flex flex-col items-center justify-center overflow-hidden min-h-[90vh]"
    >
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 w-full h-full bg-bg -z-20" />
      
      {/* Soft Glow Orbs */}
      <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-primary-light/10 blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center z-10">
        
        {/* Glowing Pill Badge */}
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUpVariants}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-light/10 text-primary-light text-sm font-semibold mb-8 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary-light-rgb),0.2)] backdrop-blur-md"
        >
          <MaterialIcon name="auto_awesome" className="text-base animate-spin-slow" />
          <span>Masa Depan Bantuan Hukum Indonesia</span>
        </motion.div>

        {/* HEADLINE */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUpVariants}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-headline font-extrabold text-main leading-[1.1] tracking-tight mb-8"
        >
          Akses Keadilan <br className="hidden sm:block" />
          untuk Semua,
          <br className="hidden sm:block" />
          <span
            className="inline-block mt-2"
            style={{
              background: "linear-gradient(to right, var(--primary-light), var(--primary), #9333ea)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
             Dimulai dari Sini.
          </span>
        </motion.h1>

        {/* SUB-HEADLINE */}
        <motion.p
          initial="hidden" animate="visible" variants={fadeUpVariants}
          className="text-lg md:text-xl text-muted max-w-3xl mx-auto leading-relaxed mb-12"
        >
          Jangan biarkan istilah hukum yang rumit menghentikan langkah Anda.<br className="hidden md:block" />
          Ceritakan masalah Anda pada <strong className="text-main font-semibold">Asisten AI</strong> kami untuk mendapatkan <strong className="text-main font-semibold">&quot;P3K Hukum&quot;</strong>, 
          temukan <strong className="text-main font-semibold">konsultan yang tepat</strong>, dan selesaikan masalah Anda secara <strong className="text-main font-semibold">aman dan transparan</strong>.
        </motion.p>

        {/* CALL TO ACTION BUTTONS */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUpVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-10 py-4 text-lg font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.6)] transition-all"
          >
            Mulai Sekarang
          </Button>
          <Button
            variant="outline"
            onClick={onLearnMore}
            className="w-full sm:w-auto px-10 py-4 text-lg font-semibold border-surface hover:bg-surface/50 transition-all backdrop-blur-sm"
          >
            Pelajari Layanan
          </Button>
        </motion.div>
      </div>

      {/* Decorative Bottom Fade */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none z-0" />
    </section>
  );
}
