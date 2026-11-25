import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LegalCard } from "@/components/ui";

const PRIVACY_CONTENT = [
  {
    title: "Ruang Lingkup",
    icon: "security",
    content: <><p>Kebijakan ini menjelaskan pemrosesan data pada prototipe akademik LangkahLegal. Versi demo tidak ditujukan untuk masyarakat umum dan hanya boleh memakai data sintetis milik tim atau penguji.</p><p className="mt-2">Prinsip yang digunakan mengacu pada UU Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), khususnya Pasal 16, Pasal 20, dan Pasal 27.</p></>,
  },
  {
    title: "Data yang Diproses",
    icon: "dataset",
    content: <><p>Platform dapat memproses nama dan email akun demo, role pengguna, profil konsultan dummy, narasi kasus sintetis, dokumen uji, percakapan AI, jadwal konsultasi, status pembayaran sandbox, serta data teknis seperti request ID dan catatan kesalahan.</p><p className="mt-2">Jangan memasukkan NIK, data kesehatan, data anak, informasi keuangan, catatan pidana, komunikasi advokat–klien, atau dokumen pihak lain yang nyata. Kategori tersebut dapat termasuk Data Pribadi spesifik menurut Pasal 4 UU PDP.</p></>,
  },
  {
    title: "Tujuan Pemrosesan",
    icon: "query_stats",
    content: <p>Data demo digunakan untuk autentikasi, pengujian role dan dashboard, simulasi konsultasi, pengoperasian fitur AI, pembayaran sandbox, pengiriman email, keamanan, pencarian kesalahan, dan penilaian mata kuliah. Data tidak boleh digunakan untuk pemasaran, profil komersial, atau keputusan hukum nyata.</p>,
  },
  {
    title: "Penyedia Layanan",
    icon: "hub",
    content: <><p>Fitur tertentu menggunakan Supabase untuk autentikasi, database, dan storage; Google Gemini dan Voyage untuk pemrosesan AI; Midtrans Sandbox untuk simulasi pembayaran; serta Brevo untuk pengiriman email. Hosting dapat menggunakan penyedia deployment yang dikonfigurasi tim.</p><p className="mt-2">Karena sebagian penyedia dapat memproses data di luar Indonesia, hanya data sintetis yang boleh dikirim. Penggunaan data nyata memerlukan penilaian transfer sesuai Pasal 55–56 UU PDP.</p></>,
  },
  {
    title: "AI dan Penyaringan Data",
    icon: "smart_toy",
    content: <p>Platform menyamarkan sejumlah pola seperti email, nomor telepon, NIK, rekening, kartu, alamat, dan nama berpola sebelum permintaan diteruskan ke penyedia AI. Penyaringan ini tidak sempurna dan tidak dapat mengenali seluruh identitas atau konteks sensitif. Karena itu, pengguna tetap wajib menghindari data nyata.</p>,
  },
  {
    title: "Keamanan",
    icon: "lock_person",
    content: <><p>Kontrol yang diterapkan meliputi cookie HttpOnly, validasi sesi dan role pada backend, penjagaan route, pembatasan origin, private storage path, signed URL sementara, validasi upload, serta pencegahan secret masuk Git dan Docker context.</p><p className="mt-2">Komunikasi bukan enkripsi ujung-ke-ujung karena server perlu membaca dan memproses isi layanan. Tidak ada sistem yang dapat menjamin risiko keamanan hilang sepenuhnya. Acuan keamanan terdapat pada Pasal 35–39 UU PDP dan Pasal 22–27 PP Nomor 71 Tahun 2019.</p></>,
  },
  {
    title: "Penyimpanan dan Penghapusan",
    icon: "schedule",
    content: <p>Data demo disimpan selama diperlukan untuk pengembangan dan penilaian, lalu database, storage, dan log dijadwalkan untuk dihapus paling lambat 30 hari setelah nilai final. Credential demo harus dirotasi atau dinonaktifkan setelah penggunaan berakhir. Ketentuan ini mengikuti prinsip pengakhiran pemrosesan dan penghapusan pada Pasal 42–45 UU PDP.</p>,
  },
  {
    title: "Hak dan Kontak",
    icon: "admin_panel_settings",
    content: <><p>Anggota tim atau penguji yang memakai email miliknya dapat meminta akses, koreksi, atau penghapusan melalui pengelola proyek. Hak subjek data antara lain diatur dalam Pasal 5–14 UU PDP.</p><p className="mt-2">Karena ini prototipe tertutup, kanal formal organisasi belum tersedia. Masalah teknis atau permintaan penghapusan dapat disampaikan kepada anggota tim yang memberikan akses demo.</p></>,
  },
  {
    title: "Perubahan Ruang Lingkup",
    icon: "warning",
    content: <p>Jika LangkahLegal dibuka untuk publik, menerima pengguna atau konsultan nyata, memproses dokumen perkara, atau mengaktifkan pembayaran production, kebijakan ini tidak lagi memadai. Audit hukum, dasar pemrosesan, retensi, kontrak vendor, prosedur hak, dan tata kelola insiden wajib ditetapkan ulang sebelum peluncuran.</p>,
  },
];

export default function PrivacyPage() {
  return <div className="relative selection:bg-primary/30 bg-bg min-h-screen transition-colors duration-500 font-primary"><Navbar /><main className="pt-24 pb-16 overflow-x-hidden min-h-[80vh]"><section className="relative pt-4 pb-8 px-6 lg:px-12 flex flex-col items-center text-center"><div className="absolute inset-0 bg-gradient-to-b from-primary-light/10 to-transparent -z-10" /><h1 className="text-3xl md:text-4xl font-black font-headline text-main mb-2 leading-tight tracking-tight">Kebijakan Privasi</h1><p className="max-w-2xl text-sm text-muted">Cara prototipe LangkahLegal menggunakan dan melindungi data demo</p><p className="mt-1 text-xs text-muted">Pembaruan terakhir: 25 November 2026</p></section><section className="px-6"><div className="max-w-3xl mx-auto space-y-4">{PRIVACY_CONTENT.map((item, idx) => <LegalCard key={item.title} item={item} index={idx + 1} />)}</div></section></main><Footer /></div>;
}
