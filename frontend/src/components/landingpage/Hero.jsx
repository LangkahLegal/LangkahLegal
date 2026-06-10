"use client";

import { motion } from "framer-motion";
import { Button } from "../ui";

// Konfigurasi container untuk mengatur efek beruntun (stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1, // Jeda waktu sebelum elemen pertama mulai muncul
      staggerChildren: 0.2, // Jeda waktu kemunculan antar elemen (0.2 detik)
    },
  },
};

// Konfigurasi animasi per-elemen (Fade In perlahan dengan sedikit pergeseran dari bawah)
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }, // durasi 0.8s agar terasa "pelan-pelan"
  },
};

export default function Hero({ onGetStarted, onLearnMore }) {
  return (
    <section
      id="hero"
      className="relative px-6 lg:py-32 max-w-7xl mx-auto flex flex-col items-center text-center"
    >
      {/* Ambient Glow Effects */}
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      {/* 
        Bungkus konten utama dengan motion.div 
        animate="visible" akan langsung memutar animasi saat halaman pertama kali dimuat
      */}
      <motion.div
        className="relative z-10 w-full flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-8 max-w-4xl flex flex-col items-center">
          {/* HEADLINE */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-headline font-extrabold text-main leading-[1.15] tracking-tight"
          >
            Akses Keadilan <br className="hidden sm:block" />
            untuk Semua,
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

          {/* SUB-HEADLINE */}
          <motion.p
            variants={itemVariants}
            className="text-base md:text-xl text-muted max-w-3xl mx-auto leading-relaxed px-2 md:px-0"
          >
            Jangan biarkan istilah hukum yang rumit menghentikan langkah Anda.<br className="hidden md:block" />
            Ceritakan masalah Anda pada <strong className="text-primary-light font-semibold">Asisten AI</strong> kami untuk mendapatkan <strong className="text-main font-semibold">&quot;P3K Hukum&quot;</strong>, <br className="hidden lg:block" />
            temukan <strong className="text-main font-semibold">konsultan yang tepat</strong>, dan selesaikan masalah Anda secara <strong className="text-main font-semibold">aman dan transparan</strong>.
          </motion.p>

          {/* CALL TO ACTION BUTTONS */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 w-full max-w-sm sm:max-w-none mx-auto"
          >
            <Button
              onClick={onGetStarted}
              className="w-full! sm:w-auto px-10 py-4 text-base md:text-lg font-semibold"
            >
              Mulai Sekarang
            </Button>
            <Button
              variant="outline"
              onClick={onLearnMore}
              className="w-full! sm:w-auto px-10 py-4 text-base md:text-lg font-semibold border-surface hover:bg-surface/50"
            >
              Pelajari Layanan
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
