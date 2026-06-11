"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui";

export default function CTA({ onGetStarted }) {
  return (
    <section className="relative w-full bg-surface overflow-hidden">
      <div className="flex flex-col md:flex-row items-stretch w-full min-h-[450px] md:min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full md:w-[60%] lg:w-[65%] flex flex-col justify-center items-start text-left relative z-10 px-6 py-16 md:py-24 md:pl-16 lg:pl-32"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-main mb-4 leading-tight">
            Siap Memperjuangkan Hak Anda?
          </h2>

          {/* REFACTOR: Kelas max-w-xl dihapus agar teks memanjang bebas mengikuti kontainer */}
          <p className="text-muted mb-8 text-base md:text-lg leading-relaxed w-full">
            Bergabunglah dengan ekosistem LangkahLegal. Bersama membangun
            keadilan yang transparan.
          </p>

          <Button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-10 py-4 text-sm md:text-base font-bold transition-transform hover:scale-105 shadow-xl shadow-primary/20"
          >
            Buat Akun Gratis
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="relative w-full md:w-[40%] lg:w-[35%] h-[400px] md:h-auto"
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={{ transform: "scaleX(-1)" }}
          >
            <Image
              src="/images/statue.png"
              alt="Keadilan"
              fill
              className="object-contain object-left-bottom drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
