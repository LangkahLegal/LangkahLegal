import { MaterialIcon } from "../ui";

const EDITORIAL_FEATURES = [
  "Konsultasi video 24/7 dengan ahli hukum tersertifikasi.",
  "Pelacakan status kasus secara real-time melalui dashboard.",
  "Template dokumen legal yang siap pakai dan sah secara hukum.",
];

export default function Editorial() {
  return (
    <section id="about" className="px-6 py-24 max-w-7xl mx-auto relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Kolom Gambar dengan Efek Dekoratif */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#ada3ff]/20 to-transparent blur-2xl rounded-full" />
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCMv65bz2iwrNGZSyL-_XYgLlXa_ba_SsRwQu9K7OiBr6G-wbyVmBhbFoMeZIIjfvzWx28LCOjl-_jeEhzOOmeEVU8TfpzutOH_mFhaQmtgYJ7Oi7ky1r2X5HXU6sCTDA6_HQYqqHNLT04WA8oGXUo_P5DDikdPaHqg-UyxiWuzLOpjJvu9mqWg1ju5TNdYo8lp2YPaLcH6n8TFFCs_3kOiR_kn3pogHUZyJoVlWXRIFw5MBEj6eSOH_JrmLE29vwL_32du-nTCmaq"
            alt="Konsultasi LangkahLegal"
            className="relative rounded-3xl w-full aspect-square object-cover shadow-2xl"
          />
        </div>

        {/* Kolom Konten Teks */}
        <div className="space-y-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#ada3ff]/10 text-[#ada3ff] font-bold text-xs uppercase tracking-widest">
            The Future of Law
          </span>

          <h2 className="text-4xl md:text-5xl font-urbanist font-bold text-[#e8e2fc] leading-tight">
            Mendefinisikan Ulang Konsultasi Hukum
          </h2>

          <p className="text-lg text-[#aca8c1] leading-relaxed">
            Kami mengerti bahwa berurusan dengan hukum bisa sangat
            mengintimidasi. LangkahLegal hadir untuk meruntuhkan batasan
            tersebut melalui platform yang mudah digunakan oleh siapa saja.
          </p>

          <ul className="space-y-4">
            {EDITORIAL_FEATURES.map((text, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <MaterialIcon name="check_circle" className="text-[#ada3ff]" />
                <span className="text-[#e8e2fc]">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
