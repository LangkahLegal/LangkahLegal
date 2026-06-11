"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialIcon } from "../ui";

const FAQS = [
  {
    question: "Apa itu LangkahLegal dan apa fungsinya?",
    answer:
      "LangkahLegal adalah platform digital yang menjembatani masyarakat dengan akses bantuan hukum yang mudah, transparan, dan terjangkau. Kami menyediakan AI untuk triase hukum awal, bursa kasus anonim, hingga konsultasi langsung dengan pakar hukum tersumpah.",
  },
  {
    question: "Apa itu AI Hukum Instan?",
    answer:
      "AI Hukum Instan adalah asisten pintar kami yang dapat menerjemahkan masalah Anda yang diceritakan dalam bahasa awam/sehari-hari menjadi istilah hukum formal, sekaligus mencarikan pasal atau undang-undang yang relevan dalam hitungan detik.",
  },
  {
    question: "Apakah identitas saya aman saat memposting kasus?",
    answer:
      "Sangat aman. Kami menggunakan sistem Bursa Kasus Anonim di mana detail pribadi Anda akan disembunyikan secara otomatis. Pengacara hanya dapat melihat inti masalah hukum Anda saat menawarkan bantuan.",
  },
  {
    question: "Bagaimana cara mendapatkan bantuan hukum Pro-Bono (Gratis)?",
    answer:
      "Anda dapat menggunakan filter khusus 'Pro-Bono' di platform kami. Sistem akan mencocokkan kasus Anda dengan Lembaga Bantuan Hukum (LBH) atau advokat relawan yang bersedia memberikan pendampingan tanpa biaya.",
  },
  {
    question: "Apakah konsultasi dilakukan secara online atau offline?",
    answer:
      "Semua sesi konsultasi awal dilakukan secara online (virtual) melalui ruang pertemuan video terenkripsi kami. Namun, jika kasus Anda memerlukan pendampingan fisik ke pengadilan, Anda dapat bersepakat langsung dengan pengacara yang bersangkutan.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full px-6 py-16 lg:py-24 z-10 bg-bg">
      <div className="max-w-3xl mx-auto flex flex-col">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-main leading-tight mb-4">
            Tanya jawab (FAQ) LangkahLegal
          </h2>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            Pertanyaan dan jawaban seputar layanan bantuan hukum kami.
          </p>
        </div>

        <div className="flex flex-col w-full border-t border-surface">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="border-b border-surface flex flex-col"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-6 md:py-8 flex justify-between items-center text-left group gap-4 focus:outline-none"
                >
                  <h3
                    className={`text-base md:text-lg font-headline font-medium transition-colors duration-300 ${
                      isOpen
                        ? "text-primary-light"
                        : "text-main group-hover:text-primary-light"
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <div
                    className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 text-danger"
                        : "rotate-0 text-muted group-hover:text-main"
                    }`}
                  >
                    <MaterialIcon name="add" className="text-2xl" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 text-sm md:text-base text-muted leading-relaxed m-0">
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
