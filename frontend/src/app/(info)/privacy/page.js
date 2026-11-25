import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LegalCard } from "@/components/ui";

const PRIVACY_CONTENT = [
  { title: "Pengendali Data", icon: "security", content: "LangkahLegal mengelola pemrosesan data pada platform. Identitas badan hukum, alamat, dan kontak privasi perlu dikonfirmasi sebelum peluncuran produksi." },
  { title: "Data yang Diproses", icon: "dataset", content: "Data dapat meliputi profil akun, informasi konsultan, isi perkara dan dokumen, percakapan AI, jadwal konsultasi, serta informasi transaksi dan teknis. Hindari memasukkan data yang tidak diperlukan." },
  { title: "Tujuan dan Dasar Pemrosesan", icon: "query_stats", content: "Data diproses untuk autentikasi, penyediaan konsultasi dan fitur AI, pembayaran, keamanan, dukungan, dan pemenuhan kewajiban hukum. Dasar pemrosesan per tujuan dan periode retensi final masih memerlukan penetapan organisasi." },
  { title: "Penerima dan Penyedia Layanan", icon: "hub", content: "Sesuai fitur yang digunakan, data dapat diterima konsultan terkait dan diproses melalui Supabase, Midtrans, penyedia AI Google Gemini dan Voyage, serta Brevo. Sebagian penyedia dapat memproses data di luar Indonesia; perlindungan transfer perlu diverifikasi." },
  { title: "Keamanan", icon: "lock_person", content: "Platform memakai cookie HttpOnly, kontrol akses aplikasi, penyamaran sejumlah pola data pribadi sebelum permintaan AI, penyimpanan dokumen privat, dan tautan sementara. Komunikasi bukan enkripsi ujung-ke-ujung karena server perlu memproses isi layanan." },
  { title: "Penyimpanan", icon: "schedule", content: "Data disimpan selama diperlukan untuk tujuan layanan, keamanan, transaksi, sengketa, dan kewajiban hukum. Jadwal retensi menyeluruh belum ditetapkan; data tidak boleh dijanjikan terhapus otomatis sampai mekanisme tersebut tersedia." },
  { title: "Hak Anda", icon: "admin_panel_settings", content: "Anda dapat meminta akses, koreksi, penghapusan, pembatasan, penarikan persetujuan bila relevan, dan portabilitas sesuai hukum. Sebagian fungsi tersedia di produk; permintaan lain memerlukan proses manual dan dapat dibatasi kewajiban retensi hukum." },
  { title: "AI dan Batasannya", icon: "smart_toy", content: "Fitur AI memberi informasi awal, dapat keliru, dan bukan pengganti nasihat profesional. Jangan mengirim identitas atau dokumen sensitif yang tidak diperlukan; periksa sumber dan konsultasikan keputusan penting." },
];

export default function PrivacyPage() {
  return <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary"><Navbar /><main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]"><section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center"><div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" /><h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">Kebijakan Privasi</h1><p className="text-sm text-muted">Pembaruan Terakhir: 25 November 2026</p></section><section className="px-6"><div className="max-w-3xl mx-auto space-y-4">{PRIVACY_CONTENT.map((item, idx) => <LegalCard key={item.title} item={item} index={idx + 1} />)}</div></section></main><Footer /></div>;
}
