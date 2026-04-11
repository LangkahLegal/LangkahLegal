import { MaterialIcon } from "../ui";

const FEATURES = [
  {
    title: "Keamanan Terjamin",
    icon: "verified_user",
    offset: "",
    desc: "Data dan privasi Anda dilindungi dengan enkripsi tingkat militer, memastikan setiap konsultasi tetap bersifat rahasia.",
  },
  {
    title: "Proses Kilat",
    icon: "speed",
    offset: "md:translate-y-8",
    desc: "Otomasi dokumen hukum yang memangkas waktu tunggu dari mingguan menjadi hitungan jam saja.",
  },
  {
    title: "Biaya Transparan",
    icon: "payments",
    offset: "",
    desc: "Tidak ada biaya tersembunyi. Semua paket layanan kami memiliki harga tetap yang kompetitif dan terukur.",
  },
];

export default function Features() {
  return (
    <section id="features" className="px-6 py-24 bg-card relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl space-y-8">
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-main leading-tight">
              Kenapa LangkahLegal?
            </h2>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Kami menggabungkan keahlian hukum tradisional dengan teknologi
              mutakhir untuk memberikan pengalaman terbaik.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((item, idx) => (
            <div
              key={idx}
              className={`bg-input p-8 rounded-3xl border border-muted/30 hover:border-primary-light/50 transition-all group flex flex-col items-center text-center ${item.offset}`}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors bg-primary-light/10 group-hover:bg-primary-light/20`}
              >
                <MaterialIcon
                  name={item.icon}
                  className="text-primary-light text-3xl"
                />
              </div>
              <h3 className="text-xl font-headline font-bold text-main mb-3">
                {item.title}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}