"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MaterialIcon, Button, LegalCard } from "@/components/ui";

const COMPLIANCE_CONTENT = [
  {
    title: "Regulasi Nasional",
    icon: "account_balance",
    content: "LangkahLegal sepenuhnya tunduk pada peraturan perundang-undangan RI, termasuk UU ITE."
  },
  {
    title: "Perlindungan Data Pribadi",
    icon: "policy",
    content: "Sistem keamanan kami dirancang sejalan dengan UU PDP untuk mencegah kebocoran data Klien maupun Konsultan."
  },
  {
    title: "Verifikasi Konsultan",
    icon: "verified",
    content: "Semua Konsultan Hukum telah melewati verifikasi ketat (KYC) dan dipastikan memiliki izin praktik resmi."
  },
  {
    title: "Anti Pencucian Uang (AML)",
    icon: "money_off",
    content: "Kami berkolaborasi dengan Payment Gateway berlisensi Bank Indonesia untuk mencegah transaksi mencurigakan."
  },
  {
    title: "Audit Keamanan",
    icon: "fact_check",
    content: "Kami melakukan audit keamanan independen secara berkala untuk memenuhi standar kepatuhan terbaru."
  }
];

export default function CompliancePage() {
  const router = useRouter();

  return (
    <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary">
      <Navbar />
      
      <main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]">
        {/* Premium Hero Section - Compact */}
        <section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" />
          <h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">
            Kepatuhan Hukum
          </h1>
          <p className="text-sm text-muted">
            Pembaruan Terakhir: 25 Mei 2026
          </p>
        </section>

        {/* Content Section - Designed like Cards - Compact */}
        <section className="px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {COMPLIANCE_CONTENT.map((item, idx) => (
              <LegalCard key={idx} item={item} index={idx + 1} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
