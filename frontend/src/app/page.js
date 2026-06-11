"use client";

import { useRouter } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

// Import Section Components
import Hero from "../components/landingpage/Hero";
import Features from "../components/landingpage/Features";
import Editorial from "../components/landingpage/Editorial";
import CTA from "../components/landingpage/CTA";
import FAQ from "../components/landingpage/FAQ";

export default function LandingPage() {
  const router = useRouter();

  /**
   * Centralized Navigation Logic
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
    <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500">
      {/* Layout: Top */}
      <Navbar />

      {/* REFACTOR: Hapus pt-24 agar Hero bisa menyentuh ujung paling atas browser */}
      <main className="overflow-x-hidden">
        {/* Section 1: Hero */}
        <Hero onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />

        {/* Section 2: Features */}
        <Features />

        {/* Section 3: Editorial */}
        <Editorial />

        {/* Section 4: CTA */}
        <CTA onGetStarted={handleGetStarted} />

        {/* Section 5: FAQ */}
        <FAQ />
      </main>

      {/* Layout: Bottom */}
      <Footer />
    </div>
  );
}
