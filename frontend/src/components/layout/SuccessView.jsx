"use client";

import { Button } from "@/components/ui";
import { motion } from "framer-motion";

export default function SuccessView({
  title = "Permintaan Booking Berhasil Terkirim!",
  description = "Mohon tunggu konfirmasi dari Konsultan, anda akan menerima email segera setelah jadwal dikonfirmasi.",
  onAction,
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
      className="fixed inset-0 z-[999] bg-[#0e0c1e] flex flex-col items-center justify-center px-8 text-center overflow-hidden"
    >
      {/* 1. SEKSI IKON (Animasi Pop-up dari Bawah) */}
      <div className="relative mb-16 flex items-center justify-center">
        {/* Efek Glow Statis di Belakang */}
        <div className="absolute w-[300px] h-[300px] bg-[#6f59fe]/10 blur-[100px] rounded-full" />

        {/* Lingkaran Luar 1 (Paling Besar) */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 100,
            delay: 0.1,
          }}
          className="w-64 h-64 rounded-full bg-[#6f59fe]/5 flex items-center justify-center"
        >
          {/* Lingkaran Luar 2 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="w-48 h-48 rounded-full bg-[#6f59fe]/10 flex items-center justify-center"
          >
            {/* Lingkaran Inti (Solid) */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, delay: 0.3 }}
              className="relative w-28 h-28 rounded-full bg-[#6f59fe] flex items-center justify-center shadow-[0_0_40px_rgba(111,89,254,0.4)]"
            >
              {/* SVG Checkmark (Tipis & Elegan sesuai Gambar) */}
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

              {/* Efek Gelombang Pulse (Baru muncul setelah ikon diam) */}
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
          className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4"
        >
          {title}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-[#aca8c1] text-sm sm:text-base leading-relaxed mb-12 px-2"
        >
          {description}
        </motion.p>

        {/* 3. TOMBOL AKSI */}
        <motion.div variants={itemVariants} className="w-full sm:w-[280px]">
          <Button
            onClick={onAction}
            fullWidth
            className="py-5 !rounded-full bg-[#17152a] hover:bg-[#1f1d35] border border-white/5 text-white font-bold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
          >
            Kembali ke Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
