"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    question: "Apa itu LangkahLegal dan apa fungsinya?",
    answer:
      "LangkahLegal adalah platform digital yang menjembatani masyarakat dengan akses bantuan hukum yang mudah, transparan, dan terjangkau.",
  },
  {
    question: "Apakah identitas saya aman saat memposting kasus?",
    answer:
      "Ya. Sistem Bursa Kasus Anonim menyembunyikan data pribadi Anda secara otomatis sehingga konsultan hanya melihat inti permasalahan saat meninjau pengajuan.",
  },
  {
    question: "Apakah semua layanan di LangkahLegal berbayar?",
    answer:
      "Tidak. Asisten AI dan jalur Bursa Kasus Pro-Bono tidak dikenakan biaya, sedangkan sesi dengan konsultan berbayar menampilkan tarif per sesi secara terbuka di awal.",
  },
  {
    question: "Apakah konsultasi dilakukan secara online atau offline?",
    answer:
      "Sesi konsultasi awal dilakukan secara daring melalui ruang pertemuan privat. Jika membutuhkan pendampingan fisik lanjutan, Anda dapat bersepakat langsung dengan konsultan terkait.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative w-full px-6 py-16 lg:py-24 z-10 bg-bg">
      <div className="max-w-3xl mx-auto flex flex-col">
        <div className="text-center mb-12 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-main leading-tight mb-4">
            Tanya jawab (FAQ) LangkahLegal
          </h2>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            Pertanyaan dan jawaban seputar layanan bantuan hukum kami.
          </p>
        </div>

        <div className="flex flex-col w-full space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`rounded-2xl transition-colors duration-200 flex flex-col ${
                  isOpen ? "bg-surface/70" : "bg-surface/35 hover:bg-surface/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 md:py-6 flex justify-between items-center text-left group gap-4 focus:outline-none"
                >
                  <h3
                    className={`text-base md:text-lg font-headline font-medium transition-colors duration-200 ${
                      isOpen
                        ? "text-primary-text"
                        : "text-main group-hover:text-primary-text"
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl font-medium text-muted w-6 text-center"
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm md:text-base text-muted leading-relaxed m-0">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
