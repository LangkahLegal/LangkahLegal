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
      // REFACTOR 1: Tambahkan min-h-screen dan justify-center agar membentang 1 layar penuh
      className="relative w-full min-h-screen overflow-hidden px-6 pt-32 pb-24 flex flex-col justify-center items-center text-center"
    >
      <Image
        src="/images/background.jpg"
        alt="LangkahLegal Background"
        fill
        priority
        className="object-cover object-center z-0"
      />

      {/* REFACTOR 2: Gunakan Gradient Overlay. 
          Atas agak terang (30%), tengah sedang (60%), bawah gelap (80%).
          Ini menjamin tombol di bawah akan SELALU terbaca kontras. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/80 z-0" />

      <div className="glow-top-left-purple z-0 opacity-70" />
      <div className="glow-bottom-right-secondary z-0 opacity-70" />

      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center mt-[-5vh]" // mt-[-5vh] untuk menaikkan konten sedikit ke tengah optis
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-8 max-w-4xl flex flex-col items-center">
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-headline font-extrabold text-white leading-[1.15] tracking-tight drop-shadow-lg"
          >
            Akses Keadilan <br className="hidden sm:block" />
            untuk Semua
            <br />
            <span
              style={{
                background:
                  "linear-gradient(to right, var(--primary-light), var(--primary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Dimulai dari Sini.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed px-2 md:px-0 drop-shadow-md"
          >
            Jangan biarkan istilah hukum yang rumit menghentikan langkah Anda.
            Ceritakan masalah Anda pada Asisten AI kami untuk mendapatkan
            &quot;P3K Hukum&quot;, temukan konsultan yang tepat, dan selesaikan
            masalah hukum Anda dengan aman dan transparan.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 w-full max-w-sm sm:max-w-none mx-auto"
          >
            <Button
              onClick={onGetStarted}
              className="w-full! sm:w-auto px-10 py-4 text-base md:text-lg font-semibold shadow-xl shadow-primary/40 hover:scale-105 transition-transform"
            >
              Mulai Sekarang
            </Button>

            <Button
              variant="outline"
              onClick={onLearnMore}
              className="w-full! sm:w-auto px-10 py-4 text-base md:text-lg font-semibold border-2 border-white/80 !text-white bg-white/10 hover:bg-white/20 hover:border-white backdrop-blur-md hover:scale-105 transition-all"
            >
              Pelajari Layanan
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
