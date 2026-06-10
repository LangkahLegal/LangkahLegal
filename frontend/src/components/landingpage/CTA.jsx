"use client";

import { motion } from "framer-motion";
import { Button } from "../ui";

export default function CTA({ onGetStarted }) {
  return (
    <section className="px-6 py-16 lg:py-24 relative z-10 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-4xl mx-auto p-10 md:p-16 bg-bg border border-surface rounded-3xl text-center relative overflow-hidden shadow-md"
      >
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-main mb-4 leading-tight max-w-xl mx-auto">
            Siap Memperjuangkan Hak Anda?
          </h2>

          <p className="text-muted mb-8 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Bergabunglah dengan ekosistem LangkahLegal. Bersama membangun keadilan yang transparan.
          </p>

          <div className="w-full sm:w-auto relative group">
            <Button
              onClick={onGetStarted}
              className="relative !w-full sm:!w-auto px-10 py-3 text-sm md:text-base font-bold transition-transform hover:scale-105 shadow-md"
            >
              Buat Akun Gratis
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
