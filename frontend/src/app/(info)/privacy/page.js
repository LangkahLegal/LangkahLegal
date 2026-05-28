"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MaterialIcon, Button, LegalCard } from "@/components/ui";

const PRIVACY_CONTENT = [
  {
    title: "Komitmen Kami",
    icon: "security",
    content: "Kami melindungi data pribadi Anda sesuai dengan ketentuan yang berlaku saat menggunakan platform LangkahLegal."
  },
  {
    title: "Informasi yang Dikumpulkan",
    icon: "dataset",
    content: "Kami mengumpulkan Data Identitas (NIK, kontak), Data Kasus (dokumen yang Anda unggah), dan Data Teknis demi keamanan sistem."
  },
  {
    title: "Penggunaan Informasi",
    icon: "query_stats",
    content: "Data Anda hanya digunakan untuk memfasilitasi sesi konsultasi hukum yang akurat serta mematuhi hukum RI."
  },
  {
    title: "Kerahasiaan",
    icon: "lock_person",
    content: "Komunikasi Anda dengan Konsultan dilindungi asas kerahasiaan hukum dengan enkripsi ujung-ke-ujung."
  },
  {
    title: "Hak Anda",
    icon: "admin_panel_settings",
    content: "Anda berhak meminta salinan, melakukan koreksi, maupun penghapusan penuh data Anda dari sistem kami."
  }
];

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary">
      <Navbar />
      
      <main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]">
        {/* Premium Hero Section - Compact */}
        <section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" />
          <h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="text-sm text-muted">
            Pembaruan Terakhir: 25 Mei 2026
          </p>
        </section>

        {/* Content Section - Designed like Cards - Compact */}
        <section className="px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {PRIVACY_CONTENT.map((item, idx) => (
              <LegalCard key={idx} item={item} index={idx + 1} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
