"use client";

import { useRouter } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button, MaterialIcon } from "../components/ui";

export default function LandingPage() {
  const router = useRouter();

  // Fungsi navigasi
  const handleGetStarted = () => {
    router.push("/auth/role");
  };

  const handleLearnMore = () => {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative selection:bg-[#ada3ff]/30">
      <Navbar />

      <main className="pt-24 overflow-x-hidden">
        {/* === HERO SECTION === */}
        <section className="relative px-6 py-20 lg:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="glow-top-left-purple" />
          <div className="glow-bottom-right-secondary" />
          
          <div className="relative z-10 space-y-8 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-urbanist font-extrabold text-[#e8e2fc] leading-[1.1] tracking-tight">
              Solusi Hukum <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ada3ff] to-[#6f59fe]">Digital & Terpercaya</span>
            </h1>
            <p className="text-lg md:text-xl text-[#aca8c1] max-w-2xl mx-auto leading-relaxed">
              Akses bantuan hukum profesional dengan satu sentuhan. Cepat, transparan, dan terjangkau untuk kebutuhan personal maupun bisnis Anda.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button onClick={handleGetStarted} className="!w-full sm:!w-auto px-10 py-4 text-lg">
                Coba Sekarang
              </Button>
              <Button variant="outline" onClick={handleLearnMore} className="!w-full sm:!w-auto px-10 py-4 text-lg">
                Pelajari Layanan
              </Button>
            </div>
          </div>

          <div className="mt-20 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-[#ada3ff]/10 bg-[#1f1d35] p-2 relative z-10">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEvueWKSnGkuhnVc-MbIOKmCpZ-4RcnjrRD9ObtzCKnRpLMnIjKW089uwG7-PIWBot5tZHBTGhDZuCu2j1qZ5aKireqEUDaDvGRq6SrK8lYIuzpoToD7aDOWPC-d6_eTb9KsFfBklx1bH6-qfVJN3usA8XYUsgQ1DM8Gv9yH1IPICTOIgR1Isd62iqwJJH_ks0cLit7eZf72RJGn4BNC9xDTfc6LUfSvryO1Qd3_tsx1qtel3DVl57bcw1-eTFITzlvNxTYfty4yKg" 
              alt="Legal workspace" 
              className="w-full h-[300px] md:h-[500px] object-cover rounded-2xl" 
            />
          </div>
        </section>

        {/* === FEATURES SECTION === */}
        <section id="features" className="px-6 py-24 bg-[#131125] relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="page-title">Kenapa LangkahLegal?</h2>
                <p className="text-[#aca8c1]">Kami menggabungkan keahlian hukum tradisional dengan teknologi mutakhir untuk memberikan pengalaman terbaik.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Keamanan Terjamin", icon: "verified_user", color: "text-[#ada3ff]", bg: "bg-[#ada3ff]/10", hover: "group-hover:bg-[#ada3ff]/20", desc: "Data dan privasi Anda dilindungi dengan enkripsi tingkat militer, memastikan setiap konsultasi tetap bersifat rahasia." },
                { title: "Proses Kilat", icon: "speed", color: "text-[#b4abef]", bg: "bg-[#b4abef]/10", hover: "group-hover:bg-[#b4abef]/20", offset: "md:translate-y-8", desc: "Otomasi dokumen hukum yang memangkas waktu tunggu dari mingguan menjadi hitungan jam saja." },
                { title: "Biaya Transparan", icon: "payments", color: "text-[#c0b5ff]", bg: "bg-[#c0b5ff]/10", hover: "group-hover:bg-[#c0b5ff]/20", desc: "Tidak ada biaya tersembunyi. Semua paket layanan kami memiliki harga tetap yang kompetitif dan terukur." }
              ].map((item, idx) => (
                <div key={idx} className={`bg-[#1f1d35] p-8 rounded-2xl border border-[#48455a] hover:border-[#ada3ff]/50 transition-all group ${item.offset || ""}`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${item.bg} ${item.hover}`}>
                    <MaterialIcon name={item.icon} className={`${item.color} text-3xl`} />
                  </div>
                  <h3 className="text-xl font-urbanist font-bold text-[#e8e2fc] mb-3">{item.title}</h3>
                  <p className="text-[#aca8c1] text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === EDITORIAL SECTION === */}
        <section id="about" className="px-6 py-24 max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#ada3ff]/20 to-transparent blur-2xl rounded-full" />
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCMv65bz2iwrNGZSyL-_XYgLlXa_ba_SsRwQu9K7OiBr6G-wbyVmBhbFoMeZIIjfvzWx28LCOjl-_jeEhzOOmeEVU8TfpzutOH_mFhaQmtgYJ7Oi7ky1r2X5HXU6sCTDA6_HQYqqHNLT04WA8oGXUo_P5DDikdPaHqg-UyxiWuzLOpjJvu9mqWg1ju5TNdYo8lp2YPaLcH6n8TFFCs_3kOiR_kn3pogHUZyJoVlWXRIFw5MBEj6eSOH_JrmLE29vwL_32du-nTCmaq" 
                alt="Consultation" 
                className="relative rounded-3xl w-full aspect-square object-cover shadow-2xl" 
              />
            </div>
            <div className="space-y-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#ada3ff]/10 text-[#ada3ff] font-bold text-xs uppercase tracking-widest font-headline">The Future of Law</span>
              <h2 className="text-4xl md:text-5xl font-urbanist font-bold text-[#e8e2fc] leading-tight">Mendefinisikan Ulang Konsultasi Hukum</h2>
              <p className="text-lg text-[#aca8c1] leading-relaxed">
                Kami mengerti bahwa berurusan dengan hukum bisa sangat mengintimidasi. LangkahLegal hadir untuk meruntuhkan batasan tersebut melalui platform yang mudah digunakan oleh siapa saja.
              </p>
              <ul className="space-y-4">
                {["Konsultasi video 24/7 dengan ahli hukum tersertifikasi.", "Pelacakan status kasus secara real-time melalui dashboard.", "Template dokumen legal yang siap pakai dan sah secara hukum."].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <MaterialIcon name="check_circle" className="text-[#ada3ff]" />
                    <span className="text-[#e8e2fc]">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* === CTA / NEWSLETTER SECTION === */}
        <section className="px-6 py-24 relative z-10">
          <div className="glass-card max-w-5xl mx-auto rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#ada3ff]/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            <h2 className="text-3xl md:text-5xl font-urbanist font-bold text-[#e8e2fc] mb-6 relative z-10">Siap Melangkah Lebih Aman?</h2>
            <p className="text-[#aca8c1] mb-10 text-lg max-w-xl mx-auto relative z-10">Gabung dengan ribuan pengguna yang telah mempercayakan urusan hukum mereka kepada LangkahLegal.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Button onClick={handleGetStarted} className="!w-full sm:!w-auto px-10 py-4">
                Mulai Sekarang
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}