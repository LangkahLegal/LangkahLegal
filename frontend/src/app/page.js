"use client";

import { useRouter } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

// Import Section Components
import Hero from "../components/landingpage/Hero";
import Features from "../components/landingpage/Features";
import Editorial from "../components/landingpage/Editorial";
import CTA from "../components/landingpage/CTA";

export default function LandingPage() {
  const router = useRouter();

  /**
   * Centralized Navigation Logic
   * Kita menjaga logika di level page agar komponen section tetap "dumb" (stateless)
   * dan bisa digunakan kembali di tempat lain jika perlu.
   */
  const handleGetStarted = () => {
    router.push("/auth/role");
  };

  const handleLearnMore = () => {
    const featureSection = document.getElementById("features");
    if (featureSection) {
      featureSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative selection:bg-primary-light/30 bg-dark min-h-screen">
      {/* Layout: Top */}
      <Navbar />

      <main className="pt-24 overflow-x-hidden">
        {/* Section 1: Hero 
            Menerima fungsi navigasi sebagai props.
        */}
        <Hero onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />

        {/* Section 2: Features 
            Sudah membungkus ID "features" di dalamnya untuk scroll-to-view.
        */}
        <Features />

        {/* Section 3: Editorial 
            Menjelaskan detail layanan secara visual.
        */}
        <Editorial />

        {/* Section 4: CTA 
            Final conversion point.
        */}
        <CTA onGetStarted={handleGetStarted} />
      </main>

      {/* Layout: Bottom */}
      <Footer />
    </div>
  );
}