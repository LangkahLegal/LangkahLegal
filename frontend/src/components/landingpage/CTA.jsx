"use client";

import { motion } from "framer-motion";
import { Button } from "../ui";

export default function CTA({ onGetStarted }) {
  return (
    <section className="px-6 py-24 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
        className="max-w-5xl mx-auto p-12 md:p-24 bg-[#0a0a0a] dark:bg-[#050505] rounded-[3rem] md:rounded-[4rem] text-center relative overflow-hidden shadow-2xl"
      >
        {/* Background Gradients for the Dark Banner */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-light/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold text-white mb-6 leading-tight max-w-2xl mx-auto">
            Siap Memperjuangkan <br className="hidden md:block" />
            Hak Anda?
          </h2>

          <p className="text-gray-400 mb-12 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ekosistem LangkahLegal sekarang. Baik Anda
            masyarakat yang mencari keadilan, maupun advokat yang siap
            memberikan dampak sosial yang nyata.
          </p>

          <div className="w-full sm:w-auto relative group">
            {/* Glowing drop shadow that pulses */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-light rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            
            <Button
              onClick={onGetStarted}
              className="relative !w-full sm:!w-auto px-12 py-5 text-lg font-bold bg-white text-black hover:bg-gray-100 border-none transition-transform hover:scale-105"
            >
              Buat Akun Gratis
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
