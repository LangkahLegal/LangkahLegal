"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MaterialIcon } from "../ui";

const FEATURES = [
  {
    id: "anonymous-cases",
    title: "Bursa Kasus Anonim",
    summary: "Ceritakan kasus tanpa menampilkan identitas di bursa.",
    description: "Tuliskan ringkasan masalah, pilih kategori, dan tentukan jadwal yang Anda inginkan. Konsultan dapat meninjau pengajuan Anda melalui bursa kasus.",
    icon: "privacy_tip",
    action: "Ajukan Kasus",
    href: "/bursa/post",
  },
  {
    id: "pro-bono",
    title: "Bantuan Pro-Bono",
    summary: "Pengajuan kasus di bursa tanpa biaya.",
    description: "Bantuan pro-bono diwujudkan melalui Bursa Kasus. Anda dapat mengajukan kasus tanpa biaya melalui layanan tersebut.",
    icon: "volunteer_activism",
  },
  {
    id: "consultants",
    title: "Cari Konsultan",
    summary: "Pilih bidang hukum, tarif, dan jadwal yang sesuai.",
    description: "Kenali konsultan melalui profilnya, bandingkan biaya, lalu pilih jadwal sebelum mengajukan konsultasi.",
    icon: "person_search",
    action: "Cari Konsultan",
    href: "/explore",
  },
];

const EXAMPLES = [
  { label: "Kontrak kerja", question: "Apa yang perlu saya siapkan sebelum konsultasi tentang kontrak kerja?" },
  { label: "Konsumen", question: "Informasi apa yang perlu saya kumpulkan ketika barang yang diterima tidak sesuai pesanan?" },
  { label: "Konsultasi", question: "Bagaimana cara menyusun kronologi masalah sebelum bertemu konsultan?" },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

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
    <section id="features" aria-labelledby="features-title" className="relative z-10 w-full scroll-mt-0 overflow-hidden bg-bg pb-16 lg:pb-0">
      <div>
        <div className="grid w-full items-stretch lg:grid-cols-2">
          <motion.div
            {...entrance}
            initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="min-w-0 px-6 pb-12 pt-28 lg:pb-10 lg:pl-12 lg:pr-12 xl:pl-16"
          >
            <h2 id="features-title" className="mb-8 text-left text-3xl font-headline font-bold leading-[1.15] text-main sm:text-4xl md:mb-10">
              Kenapa{" "}
              <span className="relative inline-block">
                LangkahLegal
                <svg aria-hidden="true" viewBox="0 0 240 12" fill="none" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-2 left-0 h-2 w-full text-secondary/60">
                  <path d="M3 8C62 2 161 2 237 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              ?
            </h2>
            <div className="border-t border-surface">
              {FEATURES.map((feature, index) => {
                const expanded = activeFeature === feature.id;
                return (
                  <div key={feature.id} className="border-b border-surface">
                    <h3>
                      <button
                        type="button"
                        id={`feature-trigger-${feature.id}`}
                        aria-expanded={expanded}
                        aria-controls={`feature-panel-${feature.id}`}
                        onClick={() => setActiveFeature(expanded ? null : feature.id)}
                        className="group flex w-full items-center gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:py-6"
                      >
                        <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${expanded ? "border-primary/25 bg-primary/10 text-primary-light" : "border-surface bg-surface/50 text-muted group-hover:border-primary/25 group-hover:text-primary-light"}`}>
                          <MaterialIcon name={feature.icon} className="text-2xl" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-base font-headline font-semibold transition-colors md:text-lg ${expanded ? "text-primary-light" : "text-main group-hover:text-primary-light"}`}>{feature.title}</span>
                          <span className="mt-1 block text-xs font-normal leading-relaxed text-muted sm:text-sm">{feature.summary}</span>
                        </span>
                        <span aria-hidden="true" className="hidden text-xs font-normal text-muted sm:block">0{index + 1}</span>
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-5 w-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-45 text-primary-light" : "text-muted group-hover:text-main"}`}>
                          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </h3>
                    <motion.div
                      id={`feature-panel-${feature.id}`}
                      role="region"
                      aria-labelledby={`feature-trigger-${feature.id}`}
                      aria-hidden={!expanded}
                      inert={!expanded}
                      initial={false}
                      animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pl-0 sm:pl-16">
                        <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
                        {feature.href && (
                          <Link href={feature.href} className="group mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary-light underline-offset-4 transition-colors hover:text-main hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                            {feature.action}<ArrowIcon />
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
            className="relative flex min-w-0 flex-col justify-center bg-surface px-6 py-12 text-main sm:px-8 lg:px-10 xl:px-12"
          >
            <div className="w-full max-w-xl">
            <div className="mb-6 flex items-center gap-3">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary-light"><MaterialIcon name="chat_bubble" className="text-2xl" /></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-light">AI Hukum Instan</span>
            </div>
            <h3 id="ai-feature-title" className="text-2xl font-headline font-bold leading-tight sm:text-3xl">Mulai dari cerita Anda.</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">Tidak perlu memahami istilah hukum lebih dulu. Ceritakan masalah Anda dengan bahasa sehari-hari kepada Asisten AI.</p>

            <div className="my-7">
              <p className="mb-3 text-xs font-medium text-muted">Pilih contoh topik</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Topik contoh pertanyaan AI">
                {EXAMPLES.map((example, index) => (
                  <button key={example.label} type="button" aria-pressed={activeExample === index} onClick={() => setActiveExample(index)} className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeExample === index ? "border-primary bg-primary text-white" : "border-primary/15 text-muted hover:border-primary/30 hover:text-main"}`}>
                    {example.label}
                  </button>
                ))}
              </div>
              <div aria-live="polite" aria-atomic="true" className="mt-5 flex min-h-28 items-start gap-3 border-l-2 border-primary/30 bg-card/70 px-4 py-4">
                <span aria-hidden="true" className="pt-0.5 text-primary-light"><MaterialIcon name="format_quote" className="text-xl" /></span>
                <motion.p key={activeExample} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="text-sm leading-relaxed">{EXAMPLES[activeExample].question}</motion.p>
              </div>
            </div>
            <Link href="/ai" className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto">
              Mulai Chat AI<ArrowIcon />
            </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
