import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LegalCard } from "@/components/ui";

const TERMS_CONTENT = [
  {
    title: "Tentang LangkahLegal",
    icon: "handshake",
    content: <><p>LangkahLegal merupakan prototipe akademik yang mensimulasikan layanan informasi hukum, pencarian konsultan, pengajuan konsultasi, dan pembayaran. Platform ini bukan penyelenggara jasa hukum dan tidak boleh digunakan untuk perkara, dokumen, atau transaksi nyata.</p><p className="mt-2">Informasi tentang layanan elektronik disusun dengan memperhatikan Pasal 9 dan Pasal 15–16 UU ITE serta Pasal 28–34 PP Nomor 71 Tahun 2019.</p></>,
  },
  {
    title: "Akun dan Akses",
    icon: "person",
    content: <><p>Pengguna bertanggung jawab menjaga akses akun dan memberikan data demo yang akurat. Akun tidak boleh dipindahtangankan atau digunakan untuk mengakses data pengguna lain. Kami dapat membatasi akun yang disalahgunakan atau mengganggu keamanan sistem.</p><p className="mt-2">Seluruh akun, profil konsultan, narasi kasus, dan dokumen pada versi ini harus berupa data sintetis.</p></>,
  },
  {
    title: "Informasi Hukum dan Fitur AI",
    icon: "smart_toy",
    content: <><p>Jawaban AI dan materi pada pusat edukasi disediakan sebagai informasi awal. Hasilnya dapat tidak lengkap, tidak mutakhir, atau kurang tepat untuk keadaan tertentu. Pengguna perlu memeriksa sumber yang ditampilkan dan tidak menjadikannya satu-satunya dasar keputusan hukum.</p><p className="mt-2">Pendekatan ini mengikuti prinsip transparansi, kredibilitas, akuntabilitas, dan pengawasan manusia dalam SE Menkominfo Nomor 9 Tahun 2023.</p></>,
  },
  {
    title: "Konsultan dan Hubungan Profesional",
    icon: "gavel",
    content: <><p>Profil konsultan dalam prototipe merupakan data demo. Tidak terbentuk hubungan advokat–klien, kuasa hukum, atau jaminan hasil perkara melalui penggunaan platform ini.</p><p className="mt-2">Jika layanan dikembangkan untuk penggunaan nyata, status advokat, kerahasiaan hubungan profesional, dan kesepakatan honorarium harus mengikuti UU Nomor 18 Tahun 2003, termasuk Pasal 19 dan Pasal 21.</p></>,
  },
  {
    title: "Pembayaran dan Pembatalan",
    icon: "payments",
    content: <><p>Fitur pembayaran hanya menggunakan Midtrans Sandbox. Tidak ada uang nyata yang boleh diproses. Pengajuan yang telah dibatalkan tidak dapat dibuatkan transaksi baru.</p><p className="mt-2">Kebijakan refund untuk transaksi nyata belum tersedia karena berada di luar ruang lingkup prototipe. Sebelum fitur komersial diaktifkan, informasi harga, pembatalan, pengembalian dana, dan penyelesaian keluhan harus ditetapkan secara jelas sesuai UU Nomor 8 Tahun 1999 tentang Perlindungan Konsumen.</p></>,
  },
  {
    title: "Penggunaan yang Dilarang",
    icon: "rule",
    content: <ul className="list-disc pl-5 space-y-1 marker:text-primary"><li>Memasukkan identitas, dokumen perkara, komunikasi rahasia, atau data pribadi nyata.</li><li>Menggunakan platform untuk tindakan melawan hukum, penipuan, gangguan sistem, atau akses tanpa hak.</li><li>Mengunggah materi yang melanggar hak pihak lain.</li><li>Mengaktifkan pembayaran production atau menawarkan jasa hukum nyata melalui versi demo.</li></ul>,
  },
  {
    title: "Ketersediaan dan Tanggung Jawab",
    icon: "info",
    content: <><p>Karena masih berupa prototipe, layanan dapat berubah, dihentikan, atau mengalami gangguan tanpa jaminan ketersediaan. Batasan ini tidak dimaksudkan untuk menghapus tanggung jawab yang tidak boleh dialihkan menurut hukum.</p><p className="mt-2">Jika kelak digunakan sebagai layanan konsumen, klausul dan tanggung jawab harus disesuaikan dengan Pasal 18 dan Pasal 19 UU Perlindungan Konsumen.</p></>,
  },
];

export default function TermsPage() {
  return <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary"><Navbar /><main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]"><section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center"><div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" /><h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">Syarat & Ketentuan</h1><p className="max-w-2xl text-sm text-muted">Ketentuan penggunaan prototipe akademik LangkahLegal</p><p className="mt-1 text-xs text-muted">Pembaruan terakhir: 25 November 2026</p></section><section className="px-6"><div className="max-w-3xl mx-auto space-y-4">{TERMS_CONTENT.map((item, idx) => <LegalCard key={item.title} item={item} index={idx + 1} />)}</div></section></main><Footer /></div>;
}
