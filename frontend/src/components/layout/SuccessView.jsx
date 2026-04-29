"use client";

import { Button } from "@/components/ui";
import { motion } from "framer-motion";

export default function SuccessView({
  title = "Permintaan Booking Berhasil Terkirim!",
  description = "Mohon tunggu konfirmasi dari Konsultan, anda akan menerima email segera setelah jadwal dikonfirmasi.",
  onAction = () => {}, // Safety: fallback fungsi kosong
}) {
  // Variasi untuk container teks agar muncul setelah ikon
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.8, // Menunggu animasi ikon selesai
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-main */
      className="fixed inset-0 z-[999] bg-bg flex flex-col items-center justify-center px-8 text-center overflow-hidden transition-colors duration-500"
    >
      {/* 1. SEKSI IKON (Animasi Pop-up dari Bawah) */}
      <div className="relative mb-16 flex items-center justify-center">
        {/* Efek Glow Statis - REFACTOR: bg-primary/10 */}
        <div className="absolute w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />

        {/* Lingkaran Luar 1 (Paling Besar) - REFACTOR: bg-primary/5 */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 100,
            delay: 0.1,
          }}
          className="w-64 h-64 rounded-full bg-primary/5 flex items-center justify-center"
        >
          {/* Lingkaran Luar 2 - REFACTOR: bg-primary/10 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center"
          >
            {/* Lingkaran Inti (Solid) - REFACTOR: bg-primary | shadow-primary */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, delay: 0.3 }}
              className="relative w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40"
            >
              {/* SVG Checkmark */}
              <motion.svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>

              {/* Efek Gelombang Pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.4, 1.6],
                  opacity: [0.3, 0.1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1,
                }}
                className="absolute inset-0 rounded-full bg-white"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* 2. SEKSI TEKS (Muncul Setelah Ikon Selesai) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-xs sm:max-w-md flex flex-col items-center"
      >
        <motion.h2
          variants={itemVariants}
          /* REFACTOR: text-white -> text-main */
          className="text-2xl sm:text-3xl font-bold text-main leading-tight mb-4 transition-colors duration-500"
        >
          {title}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          /* REFACTOR: text-[#aca8c1] -> text-muted */
          className="text-muted text-sm sm:text-base leading-relaxed mb-12 px-2 transition-colors duration-500"
        >
          {description}
        </motion.p>

        {/* 3. TOMBOL AKSI */}
        <motion.div variants={itemVariants} className="w-full sm:w-[280px]">
          <Button
            onClick={onAction}
            fullWidth
            /* REFACTOR: bg-card | hover:bg-input | border-surface | text-main */
            className="py-5 !rounded-full bg-card hover:bg-input border border-surface text-main font-bold transition-all shadow-lg"
          >
            Kembali ke Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
