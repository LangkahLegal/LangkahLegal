"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MaterialIcon, Button } from "@/components/ui";
import AboutHero from "@/components/setting/about/AboutHero";
import VisiMisiCards from "@/components/setting/about/VisiMisiCards";
import CoreValues from "@/components/setting/about/CoreValues";
import BottomBanner from "@/components/setting/about/BottomBanner";

export default function PublicAboutPage() {
  const router = useRouter();

  return (
    <div className="relative selection:bg-primary/30 bg-bg min-h-screen flex flex-col overflow-x-hidden transition-colors duration-500 font-primary">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 w-full">
        <div className="max-w-4xl mx-auto w-full px-6 space-y-8 animate-fade-in">
          <AboutHero />
          <VisiMisiCards />
          <CoreValues />
          <BottomBanner />
        </div>
      </main>

      <Footer />
    </div>
  );
}
