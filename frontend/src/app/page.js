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
    /* REFACTOR: selection:bg-primary/30 | bg-bg | Tambahkan transition agar smooth */
    <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500">
      {/* Layout: Top */}
      <Navbar />

      <main className="pt-24 overflow-x-hidden">
        {/* Section 1: Hero */}
        <Hero onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />

        {/* Section 2: Features */}
        <Features />

        {/* Section 3: Editorial */}
        <Editorial />

        {/* Section 4: CTA */}
        <CTA onGetStarted={handleGetStarted} />
      </main>

      {/* Layout: Bottom */}
      <Footer />
    </div>
  );
}
