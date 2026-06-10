"use client";

import { motion } from "framer-motion";
import { Button } from "../ui";

export default function CTA({ onGetStarted }) {
  return (
    <section className="px-6 py-10 relative z-10">
      {/* Menggunakan motion.div untuk animasi membesar (Zoom-in) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} // Mulai dari transparan dan ukuran 80%
        whileInView={{ opacity: 1, scale: 1 }} // Membesar ke ukuran 100% dan terlihat jelas
        viewport={{ once: true, margin: "-50px" }} // Memicu animasi saat elemen masuk ke layar
        transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }} // Transisi mulus (Cubic-bezier)
        className="max-w-4xl mx-auto p-12 md:p-20 bg-input border border-surface rounded-[2.5rem] md:rounded-[3rem] text-center relative overflow-hidden shadow-2xl"
      >
        {/* Ambient Glow / Decorative Blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-main mb-6 leading-tight max-w-lg mx-auto">
            Siap Memperjuangkan Hak Anda?
          </h2>

          {/* Deskripsi */}
          <p className="text-muted mb-10 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Bergabunglah dengan ekosistem LangkahLegal sekarang. Baik Anda
            masyarakat yang mencari keadilan, maupun advokat yang siap
            memberikan dampak sosial yang nyata.
          </p>

          {/* Tombol */}
          <div className="w-full sm:w-auto">
            <Button
              onClick={onGetStarted}
              className="!w-full sm:!w-auto px-12 py-4 text-base md:text-lg font-bold hover:scale-105 transition-transform"
            >
              Buat Akun Gratis
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
