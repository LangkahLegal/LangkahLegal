"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export default function Hero({ onGetStarted, onLearnMore }) {
  return (
    <section
      id="hero"
      className="relative flex h-screen min-h-[600px] w-full items-center overflow-hidden px-4 pb-8 pt-20 sm:px-6"
    >
      <Image
        src="/images/background.jpg"
        alt="LangkahLegal Background"
        fill
        priority
        className="z-0 object-cover object-right"
      />

      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/95 via-black/75 to-black/10" />
      <div className="glow-bottom-right-secondary z-0 opacity-70" />

      <motion.div
        className="relative z-10 mx-auto mt-6 flex w-full max-w-7xl flex-col items-center md:mt-10 md:items-start"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex max-w-3xl flex-col items-center space-y-6 text-center md:items-start md:space-y-8 md:text-left">
          <motion.h1
            data-testid="landing-hero-title"
            variants={itemVariants}
            className="text-4xl md:text-7xl font-headline font-extrabold text-white leading-[1.15] tracking-tight drop-shadow-lg"
          >
            Akses Keadilan <br className="hidden sm:block" />
            untuk Semua
            <br />
            <span className="text-secondary drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
              Dimulai dari Sini.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-2xl px-2 text-base leading-relaxed text-white drop-shadow-[0_2px_7px_rgba(0,0,0,0.95)] md:mx-0 md:px-0 md:text-lg"
          >
            Masalah hukum terasa rumit? Mulai dari sini. Ceritakan masalah Anda, temukan solusi dan konsultan hukum yang tepat.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-4 pt-2 sm:max-w-none sm:flex-row md:mx-0 md:justify-start md:pt-4"
          >
            <Button
              onClick={onGetStarted}
              data-testid="landing-start-btn"
              className="w-full! sm:w-auto px-10 py-4 text-base md:text-lg font-semibold shadow-xl shadow-secondary/25 hover:scale-105 transition-transform"
            >
              Mulai Sekarang
            </Button>

            <Button
              variant="outline"
              onClick={onLearnMore}
              className="w-full! sm:w-auto px-10 py-4 text-base md:text-lg font-semibold border-2 border-white/80 !text-white bg-white/5 hover:bg-white/10 hover:border-white backdrop-blur-sm hover:scale-105 transition-all"
            >
              Pelajari Layanan
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
