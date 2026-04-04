import { MaterialIcon } from "../ui";

const FEATURES = [
  {
    title: "Keamanan Terjamin",
    icon: "verified_user",
    color: "text-[#ada3ff]",
    bg: "bg-[#ada3ff]/10",
    hover: "group-hover:bg-[#ada3ff]/20",
    desc: "Data dan privasi Anda dilindungi dengan enkripsi tingkat militer, memastikan setiap konsultasi tetap bersifat rahasia.",
  },
  {
    title: "Proses Kilat",
    icon: "speed",
    color: "text-[#b4abef]",
    bg: "bg-[#b4abef]/10",
    hover: "group-hover:bg-[#b4abef]/20",
    offset: "md:translate-y-8",
    desc: "Otomasi dokumen hukum yang memangkas waktu tunggu dari mingguan menjadi hitungan jam saja.",
  },
  {
    title: "Biaya Transparan",
    icon: "payments",
    color: "text-[#c0b5ff]",
    bg: "bg-[#c0b5ff]/10",
    hover: "group-hover:bg-[#c0b5ff]/20",
    desc: "Tidak ada biaya tersembunyi. Semua paket layanan kami memiliki harga tetap yang kompetitif dan terukur.",
  },
];

export default function Features() {
  return (
    <section id="features" className="px-6 py-24 bg-[#131125] relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="page-title text-3xl font-bold text-[#e8e2fc]">
              Kenapa LangkahLegal?
            </h2>
            <p className="text-[#aca8c1]">
              Kami menggabungkan keahlian hukum tradisional dengan teknologi
              mutakhir untuk memberikan pengalaman terbaik.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((item, idx) => (
            <div
              key={idx}
              className={`bg-[#1f1d35] p-8 rounded-2xl border border-[#48455a] hover:border-[#ada3ff]/50 transition-all group ${item.offset || ""}`}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${item.bg} ${item.hover}`}
              >
                <MaterialIcon
                  name={item.icon}
                  className={`${item.color} text-3xl`}
                />
              </div>
              <h3 className="text-xl font-urbanist font-bold text-[#e8e2fc] mb-3">
                {item.title}
              </h3>
              <p className="text-[#aca8c1] text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
