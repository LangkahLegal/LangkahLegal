"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../ui";

const FEATURES = [
  {
    title: "Triase Hukum Berbasis AI",
    icon: "smart_toy",
    offset: "",
    desc: "Tidak paham pasal? Ceritakan masalah Anda dengan bahasa sehari-hari. AI cerdas kami akan menganalisis dan menerjemahkannya ke ranah hukum yang tepat dalam hitungan detik.",
  },
  {
    title: "Privasi & Bursa Kasus Anonim",
    icon: "privacy_tip",
    offset: "",
    desc: "Lindungi identitas Anda. Posting ringkasan kasus Anda ke Papan Kasus secara anonim, dan biarkan konsultan hukum yang tepat memberikan penawaran bantuan kepada Anda.",
  },
  {
    title: "Transparan & Opsi Pro-Bono",
    icon: "account_balance_wallet",
    offset: "",
    desc: "Nikmati kemudahan pembayaran yang terintegrasi. Kami juga menyediakan filter khusus untuk menemukan bantuan hukum cuma-cuma (Pro-Bono).",
  },
];
export default function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  // 1. Auto-Rotate setiap 5 Detik
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  // 2. Fungsi Pindah Kartu
  const handleNext = () =>
    setActiveIndex((prev) => (prev + 1) % FEATURES.length);
  const handlePrev = () =>
    setActiveIndex((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);

  // 3. Dukungan Swipe untuk Mobile
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setIsHovered(true);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartX - touchEndX;

    if (distance > 50) handleNext(); // Swipe Kiri
    if (distance < -50) handlePrev(); // Swipe Kanan

    setIsHovered(false);
  };

  return (
    <section
      id="features"
      className="px-6 py-24 bg-card relative z-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="relative w-full max-w-5xl mx-auto mb-24 md:mb-32">
          {/* Kartu 1 (Belakang): Gambar Kiri-Atas */}
          <div className="absolute top-0 left-0 w-[90%] md:w-[75%] h-[260px] md:h-[380px] rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEvueWKSnGkuhnVc-MbIOKmCpZ-4RcnjrRD9ObtzCKnRpLMnIjKW089uwG7-PIWBot5tZHBTGhDZuCu2j1qZ5aKireqEUDaDvGRq6SrK8lYIuzpoToD7aDOWPC-d6_eTb9KsFfBklx1bH6-qfVJN3usA8XYUsgQ1DM8Gv9yH1IPICTOIgR1Isd62iqwJJH_ks0cLit7eZf72RJGn4BNC9xDTfc6LUfSvryO1Qd3_tsx1qtel3DVl57bcw1-eTFITzlvNxTYfty4yKg"
              alt="LangkahLegal Background"
              // Blur dikurangi tajam menjadi [2px] dan opacity dinaikkan agar detailnya sangat jelas
              className="w-full h-full object-cover blur-[2px] scale-105 opacity-90 transition-all duration-500 hover:blur-none"
            />
            {/* Overlay gelap yang sangat tipis agar tidak menutupi gambar */}
            <div className="absolute inset-0 bg-bg/20" />
          </div>

          {/* Kartu 2 (Depan): Teks Kanan-Bawah */}
          <div className="relative z-10 w-[90%] md:w-[65%] ml-auto mt-[160px] md:mt-[200px] bg-input/90 backdrop-blur-xl border border-surface p-6 sm:p-8 md:p-14 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-primary/10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-main leading-tight mb-4 md:mb-6 break-words">
              Kenapa LangkahLegal?
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-muted leading-relaxed">
              Kami mendigitalisasi proses bantuan hukum agar lebih mudah
              diakses, menjaga privasi Anda, dan transparan dalam setiap
              prosesnya.
            </p>
          </div>
        </div>

        {/* 3D Rotating Carousel Container */}
        <div
          className="relative w-full max-w-5xl mx-auto h-[450px] md:h-[400px] flex justify-center items-center perspective-1000"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {FEATURES.map((item, index) => {
            let offset = index - activeIndex;
            if (offset < -Math.floor(FEATURES.length / 2))
              offset += FEATURES.length;
            if (offset > Math.floor(FEATURES.length / 2))
              offset -= FEATURES.length;

            let stateClasses = "";
            let isClickable = false;

            if (offset === 0) {
              // KARTU TENGAH (Aktif)
              stateClasses =
                "z-30 scale-100 translate-x-0 translate-y-0 opacity-100 shadow-2xl shadow-primary/20 hover:scale-[1.03]";
            } else if (offset === 1) {
              // KARTU KANAN (Diberikan sedikit rotasi agar membentuk kipas/domino miring)
              stateClasses =
                "z-20 scale-[0.85] translate-x-[45%] md:translate-x-[65%] lg:translate-x-[75%] translate-y-6 md:translate-y-8 rotate-3 opacity-40 hover:opacity-80 cursor-pointer blur-[1px] hover:blur-none origin-bottom-left";
              isClickable = true;
            } else if (offset === -1) {
              // KARTU KIRI (Diberikan sedikit rotasi agar membentuk kipas/domino miring)
              stateClasses =
                "z-20 scale-[0.85] -translate-x-[45%] md:-translate-x-[65%] lg:-translate-x-[75%] translate-y-6 md:translate-y-8 -rotate-3 opacity-40 hover:opacity-80 cursor-pointer blur-[1px] hover:blur-none origin-bottom-right";
              isClickable = true;
            } else {
              // KARTU TERSEMBUNYI
              stateClasses =
                "z-10 scale-[0.6] translate-x-0 translate-y-20 opacity-0 pointer-events-none";
            }

            return (
              <div
                key={index}
                onClick={() => isClickable && setActiveIndex(index)}
                className={`absolute w-[85vw] max-w-[340px] md:max-w-[380px] bg-input p-8 md:p-10 rounded-[2.5rem] border border-muted/30 transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex flex-col items-start text-left ${stateClasses}`}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-primary-light/10">
                  <MaterialIcon
                    name={item.icon}
                    className="text-primary-light text-3xl"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold text-main mb-4 leading-snug">
                  {item.title}
                </h3>
                <p className="text-muted text-base leading-relaxed text-justify">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Indikator Titik (Dots) Bawah */}
        <div className="flex gap-3 mt-8 md:mt-12 z-20 relative">
          {FEATURES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${
                activeIndex === idx
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted/30 hover:bg-muted/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}