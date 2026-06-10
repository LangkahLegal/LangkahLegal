"use client";

import { motion } from "framer-motion";
import { Button, MaterialIcon } from "../ui";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Hero({ onGetStarted, onLearnMore }) {
  return (
    <section
      id="hero"
      className="relative z-0 px-6 pt-32 pb-12 lg:pt-40 lg:pb-20 w-full flex flex-col items-center justify-center overflow-hidden bg-bg min-h-[100vh]"
    >
      {/* Background Image with Blur & Overlay */}
      <div 
        className="absolute inset-0 w-full h-full -z-20 opacity-80 dark:opacity-60"
        style={{
          backgroundImage: "url('/images/consultation.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)",
        }}
      />
      {/* Light/Dark Overlay to ensure text readability without cutting off the image */}
      <div className="absolute inset-0 bg-bg/70 -z-10" />

      {/* Soft Glow Orbs */}
      <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-primary-light/10 blur-[100px] -z-10" />
      <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto flex flex-col items-center text-center z-10 pt-8">

        {/* HEADLINE */}
        <motion.h1
          initial="hidden" animate="visible" variants={fadeUpVariants}
          className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-main leading-tight tracking-tight mb-6 drop-shadow-md"
        >
          Akses Keadilan untuk Semua, <br className="hidden sm:block" />
          <span
            style={{
              background: "linear-gradient(to right, var(--primary-light), var(--primary))",
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
          className="text-sm md:text-base text-muted max-w-2xl mx-auto leading-relaxed mb-8"
        >
          Selesaikan masalah hukum tanpa ribet. Mulai dari <strong className="text-main font-semibold">Analisis AI</strong> instan, 
          hingga konsultasi aman dengan <strong className="text-main font-semibold">Pengacara Terpercaya</strong>.
        </motion.p>

        {/* CALL TO ACTION BUTTONS */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUpVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3 text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all"
          >
            Mulai Sekarang
          </Button>
          <Button
            variant="outline"
            onClick={onLearnMore}
            className="w-full sm:w-auto px-8 py-3 text-sm md:text-base font-semibold border-surface hover:bg-surface/50 transition-all bg-bg"
          >
            Pelajari Layanan
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
