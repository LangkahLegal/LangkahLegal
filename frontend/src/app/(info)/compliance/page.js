import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LegalCard } from "@/components/ui";

const COMPLIANCE_CONTENT = [
  { title: "Regulasi Nasional", icon: "account_balance", content: "Platform dirancang dengan mengacu pada regulasi Indonesia yang relevan. Status kepatuhan organisasi memerlukan verifikasi hukum, operasional, kontrak, dan kondisi produksi." },
  { title: "Perlindungan Data Pribadi", icon: "policy", content: "Kontrol teknis tersedia secara parsial, termasuk autentikasi, pembatasan akses, private storage, signed URL, dan penyamaran pola data sebelum pemrosesan AI. Kontrol ini tidak menjamin seluruh risiko kebocoran dapat dicegah." },
  { title: "Verifikasi Konsultan", icon: "verified", content: "Platform menyediakan status verifikasi berdasarkan data dan dokumen yang diperiksa admin. Keabsahan izin praktik serta proses pemeriksaan organisasi perlu diverifikasi secara berkala." },
  { title: "Pembayaran", icon: "payments", content: "Pembayaran diproses melalui Midtrans. Status lisensi, kontrak, retensi, dan pengendalian vendor perlu diverifikasi melalui dokumen resmi yang berlaku." },
  { title: "Audit Keamanan", icon: "fact_check", content: "Repository menjalankan analisis CodeQL dan pemeriksaan kode. Audit independen, pengujian penetrasi produksi, serta bukti tindak lanjut belum dinyatakan tersedia sampai artefaknya diverifikasi." },
];

export default function CompliancePage() {
  return <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary"><Navbar /><main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]"><section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center"><div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" /><h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">Kepatuhan Hukum</h1><p className="text-sm text-muted">Pembaruan Terakhir: 25 November 2026</p></section><section className="px-6"><div className="max-w-3xl mx-auto space-y-4">{COMPLIANCE_CONTENT.map((item, idx) => <LegalCard key={item.title} item={item} index={idx + 1} />)}</div></section></main><Footer /></div>;
}
