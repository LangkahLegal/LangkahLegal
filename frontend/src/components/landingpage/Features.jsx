"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const FEATURES = [
  {
    id: "anonymous-cases",
    title: "Bursa Kasus Anonim & Pro-Bono",
    summary: "Ajukan masalah tanpa identitas, termasuk jalur bebas biaya.",
    description:
      "Tuliskan ringkasan masalah, pilih kategori, dan tentukan jadwal tanpa menampilkan data diri. Tersedia juga pendampingan pro-bono dari praktisi relawan.",
    action: "Ajukan Kasus",
    href: "/bursa/post",
  },
  {
    id: "consultants",
    title: "Cari Konsultan",
    summary: "Pilih bidang hukum, tarif, dan jadwal yang sesuai.",
    description:
      "Kenali konsultan melalui profilnya, bandingkan biaya per sesi secara terbuka, lalu pilih jadwal sebelum mengajukan konsultasi.",
    action: "Cari Konsultan",
    href: "/explore",
  },
];

const EXAMPLES = [
  {
    label: "Kontrak kerja",
    question:
      "Apa yang perlu saya siapkan sebelum konsultasi tentang kontrak kerja?",
  },
  {
    label: "Konsumen",
    question:
      "Informasi apa yang perlu saya kumpulkan ketika barang yang diterima tidak sesuai pesanan?",
  },
  {
    label: "Konsultasi",
    question:
      "Bagaimana cara menyusun kronologi masalah sebelum bertemu konsultan?",
  },
];

export default function Features() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0].id);
  const [activeExample, setActiveExample] = useState(0);
  const reduceMotion = useReducedMotion();

  const entrance = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: reduceMotion ? 0 : 0.45 },
  };

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="relative z-10 w-full scroll-mt-0 overflow-hidden bg-bg pb-16 lg:pb-0"
    >
      <div className="grid w-full items-stretch lg:grid-cols-2">
        <motion.div
          {...entrance}
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="min-w-0 px-6 pb-12 pt-24 lg:pb-16 lg:pl-12 lg:pr-12 xl:pl-16 flex flex-col justify-center"
        >
          <h2
            id="features-title"
            className="mb-8 text-left text-3xl font-headline font-bold leading-[1.15] text-main sm:text-4xl"
          >
            Kenapa LangkahLegal?
          </h2>

          <div className="space-y-3">
            {FEATURES.map((feature) => {
              const expanded = activeFeature === feature.id;
              return (
                <div
                  key={feature.id}
                  className={`rounded-2xl transition-colors duration-200 ${
                    expanded ? "bg-surface/70" : "hover:bg-surface/40"
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      id={`feature-trigger-${feature.id}`}
                      aria-expanded={expanded}
                      aria-controls={`feature-panel-${feature.id}`}
                      onClick={() =>
                        setActiveFeature(expanded ? null : feature.id)
                      }
                      className="group flex w-full items-center justify-between gap-4 px-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-base font-headline font-semibold transition-colors md:text-lg ${
                            expanded
                              ? "text-primary-text"
                              : "text-main group-hover:text-primary-text"
                          }`}
                        >
                          {feature.title}
                        </span>
                        <span className="mt-1 block text-xs font-normal leading-relaxed text-muted sm:text-sm">
                          {feature.summary}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-xl font-medium text-muted shrink-0 w-6 text-center"
                      >
                        {expanded ? "−" : "+"}
                      </span>
                    </button>
                  </h3>
                  <motion.div
                    id={`feature-panel-${feature.id}`}
                    role="region"
                    aria-labelledby={`feature-trigger-${feature.id}`}
                    aria-hidden={!expanded}
                    inert={!expanded}
                    initial={false}
                    animate={{
                      height: expanded ? "auto" : 0,
                      opacity: expanded ? 1 : 0,
                    }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.25,
                      ease: "easeInOut",
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <p className="text-sm leading-relaxed text-muted">
                        {feature.description}
                      </p>
                      {feature.href && (
                        <Link
                          href={feature.href}
                          className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text transition-colors hover:text-main focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        >
                          {feature.action}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.aside
          {...entrance}
          initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          aria-labelledby="ai-feature-title"
          className="relative flex min-w-0 flex-col justify-center bg-surface px-6 py-16 text-main sm:px-8 lg:px-10 xl:px-12"
        >
          <div className="w-full max-w-xl">
            <h3
              id="ai-feature-title"
              className="text-2xl font-headline font-bold leading-tight sm:text-3xl"
            >
              Mulai dari cerita Anda.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Tidak perlu memahami istilah hukum lebih dulu. Ceritakan masalah
              Anda dengan bahasa sehari-hari kepada Asisten AI.
            </p>

            <div className="my-7">
              <p className="mb-3 text-xs font-medium text-muted">
                Pilih contoh topik
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Topik contoh pertanyaan AI"
              >
                {EXAMPLES.map((example, index) => (
                  <button
                    key={example.label}
                    type="button"
                    aria-pressed={activeExample === index}
                    onClick={() => setActiveExample(index)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      activeExample === index
                        ? "bg-primary text-on-primary"
                        : "bg-card/60 text-muted hover:bg-card hover:text-main"
                    }`}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
              <div
                aria-live="polite"
                aria-atomic="true"
                className="mt-4 flex min-h-24 items-center rounded-2xl bg-card px-5 py-4 shadow-soft"
              >
                <motion.p
                  key={activeExample}
                  initial={{ opacity: reduceMotion ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm leading-relaxed text-main"
                >
                  {EXAMPLES[activeExample].question}
                </motion.p>
              </div>
            </div>

            <Link
              href="/ai"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto"
            >
              Mulai Chat AI
            </Link>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
