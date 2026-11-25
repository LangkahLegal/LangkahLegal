import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LegalCard } from "@/components/ui";

const COMPLIANCE_CONTENT = [
  {
    title: "Status dan Ruang Lingkup",
    icon: "account_balance",
    content: <><p>LangkahLegal saat ini merupakan prototipe akademik tertutup, bukan layanan hukum atau platform komersial. Penilaian kepatuhan dilakukan terhadap source code dan skenario demo tanpa pengguna, data, konsultan, atau pembayaran nyata.</p><p className="mt-2">Status ini bukan pernyataan kepatuhan untuk layanan production. Audit harus diulang jika ruang lingkup penggunaan berubah.</p></>,
  },
  {
    title: "Pelindungan Data Pribadi",
    icon: "policy",
    content: <><p>Desain platform memperhatikan prinsip pemrosesan terbatas, transparansi, keamanan, dan penghapusan dalam UU Nomor 27 Tahun 2022, terutama Pasal 16, Pasal 27, Pasal 35–39, dan Pasal 42–45.</p><p className="mt-2">Kontrol teknis meliputi cookie HttpOnly, pemeriksaan sesi dan role, penjagaan route, private storage, signed URL, penyamaran pola data sebelum pemrosesan AI, dan penghapusan dokumen yang mempertahankan metadata bila storage gagal. Untuk demo, kontrol ini harus disertai larangan penggunaan data nyata.</p></>,
  },
  {
    title: "Sistem Elektronik dan Keamanan",
    icon: "shield",
    content: <><p>LangkahLegal menerapkan validasi input dan upload, security headers, pembatasan origin, logging dengan request ID, pengujian unit, lint, build check, dan analisis CodeQL.</p><p className="mt-2">Kontrol tersebut mengacu pada prinsip sistem elektronik yang andal, aman, dan bertanggung jawab dalam Pasal 15–16 UU ITE serta Pasal 22–27 PP Nomor 71 Tahun 2019. Audit independen dan pengujian penetrasi production belum dilakukan karena berada di luar scope prototipe.</p></>,
  },
  {
    title: "Kecerdasan Artifisial",
    icon: "smart_toy",
    content: <><p>Fitur AI diposisikan sebagai alat bantu informasi. Jawaban dapat keliru dan tidak menggantikan pertimbangan manusia atau nasihat profesional. Sumber perlu diperiksa sebelum informasi digunakan.</p><p className="mt-2">Pendekatan ini mengikuti pedoman transparansi, keamanan, kredibilitas, akuntabilitas, pelindungan data, dan pengawasan manusia dalam SE Menkominfo Nomor 9 Tahun 2023. Surat edaran tersebut merupakan pedoman etika, bukan dasar untuk menyatakan sertifikasi kepatuhan.</p></>,
  },
  {
    title: "Konsultan dan Profesi Hukum",
    icon: "verified",
    content: <><p>Seluruh profil konsultan pada versi demo harus menggunakan identitas sintetis. Label verifikasi hanya mensimulasikan proses pemeriksaan admin dan bukan bukti izin praktik seseorang.</p><p className="mt-2">Jika digunakan untuk layanan nyata, status advokat, hubungan profesional, kerahasiaan, dan honorarium perlu diverifikasi berdasarkan UU Nomor 18 Tahun 2003, termasuk Pasal 19 dan Pasal 21.</p></>,
  },
  {
    title: "Pembayaran dan Perlindungan Konsumen",
    icon: "payments",
    content: <><p>Backend membatasi Midtrans ke mode sandbox dan menolak konfigurasi production. Konsultasi yang dibatalkan tidak dapat dibayar kembali. Tidak ada transaksi uang nyata atau kebijakan refund komersial pada versi ini.</p><p className="mt-2">Sebelum penggunaan komersial, informasi layanan, harga, risiko, pembatalan, refund, pengaduan, dan klausul baku wajib ditinjau sesuai UU Nomor 8 Tahun 1999, khususnya Pasal 4–10 dan Pasal 18–19.</p></>,
  },
  {
    title: "Email dan Autentikasi",
    icon: "mail",
    content: <p>Supabase Auth mengelola pembuatan, masa berlaku, rate limit, dan verifikasi OTP. Brevo digunakan sebagai pengirim melalui Custom SMTP setelah sender terverifikasi. Profil aplikasi dibuat pada saat signup; jika pembuatan profil gagal, akun Auth dibersihkan agar tidak meninggalkan akun tanpa profil.</p>,
  },
  {
    title: "Batas Kepatuhan Demo",
    icon: "fact_check",
    content: <ul className="list-disc pl-5 space-y-1 marker:text-primary"><li>Deployment hanya untuk tim, dosen, dan penguji.</li><li>Seluruh data dan dokumen harus sintetis.</li><li>Midtrans hanya boleh menggunakan sandbox.</li><li>Deployment dimatikan dan credential dirotasi setelah demo.</li><li>Database, storage, dan log dihapus paling lambat 30 hari setelah nilai final.</li><li>Akses publik atau penggunaan data nyata memicu audit ulang sebelum layanan dijalankan.</li></ul>,
  },
  {
    title: "Referensi Utama",
    icon: "menu_book",
    content: <ul className="space-y-1"><li>UU Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.</li><li>UU Nomor 11 Tahun 2008 sebagaimana diubah, terakhir dengan UU Nomor 1 Tahun 2024, tentang Informasi dan Transaksi Elektronik.</li><li>PP Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik.</li><li>UU Nomor 8 Tahun 1999 tentang Perlindungan Konsumen.</li><li>UU Nomor 18 Tahun 2003 tentang Advokat.</li><li>SE Menkominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial.</li></ul>,
  },
];

export default function CompliancePage() {
  return <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary"><Navbar /><main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]"><section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center"><div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" /><h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">Kepatuhan Regulasi</h1><p className="max-w-2xl text-sm text-muted">Ringkasan kontrol dan batas kepatuhan prototipe LangkahLegal</p><p className="mt-1 text-xs text-muted">Pembaruan terakhir: 25 November 2026</p></section><section className="px-6"><div className="max-w-3xl mx-auto space-y-4">{COMPLIANCE_CONTENT.map((item, idx) => <LegalCard key={item.title} item={item} index={idx + 1} />)}</div></section></main><Footer /></div>;
}
