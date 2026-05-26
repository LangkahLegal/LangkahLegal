"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MaterialIcon, Button, LegalCard } from "@/components/ui";

const TERMS_CONTENT = [
  {
    title: "Layanan Platform",
    icon: "handshake",
    content: "Kami menghubungkan Anda dengan Konsultan Hukum profesional. Saran hukum sepenuhnya menjadi tanggung jawab Konsultan."
  },
  {
    title: "Kewajiban Pengguna",
    icon: "rule",
    content: (
      <ul className="list-disc pl-5 space-y-1 marker:text-primary">
        <li>Berikan informasi yang akurat.</li>
        <li>Dilarang menggunakan platform untuk tujuan ilegal.</li>
        <li>Jaga etika komunikasi dengan Konsultan.</li>
      </ul>
    )
  },
  {
    title: "Pembayaran & Refund",
    icon: "payments",
    content: "Pembayaran dilakukan via sistem resmi LangkahLegal. Refund hanya berlaku jika dibatalkan sebelum jadwal konsultasi dimulai."
  },
  {
    title: "Batasan Tanggung Jawab",
    icon: "gavel",
    content: "LangkahLegal tidak bertanggung jawab atas hasil akhir atau proses hukum yang timbul dari saran Konsultan."
  }
];

export default function TermsPage() {
  const router = useRouter();
  
  return (
    <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary">
      <Navbar />
      
      <main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]">
        {/* Premium Hero Section - Compact */}
        <section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" />
          <h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">
            Syarat & Ketentuan
          </h1>
          <p className="text-sm text-muted">
            Pembaruan Terakhir: 25 Mei 2026
          </p>
        </section>

        {/* Content Section - Designed like Cards - Compact */}
        <section className="px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {TERMS_CONTENT.map((item, idx) => (
              <LegalCard key={idx} item={item} index={idx + 1} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
