import { MaterialIcon } from "@/components/ui";

const CORE_VALUES = [
  {
    title: "Integritas",
    desc: "Menjaga standar etika profesi hukum tertinggi.",
    icon: "local_police", 
  },
  {
    title: "Transparansi",
    desc: "Biaya dan proses yang jelas sejak awal.",
    icon: "receipt_long",
  },
  {
    title: "Aksesibilitas",
    desc: "Layanan hukum profesional yang terjangkau.",
    icon: "payments", 
  },
];

export default function CoreValues() {
  return (
    <div className="space-y-6 mb-12">
      <h2 className="text-xl lg:text-2xl font-bold text-white">
        Nilai Utama Kami
      </h2>
      <div className="flex flex-col gap-4 lg:gap-5">
        {CORE_VALUES.map((item, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-5 bg-white/5 border border-white/10 p-4 lg:p-5 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl bg-[#1f1d35] border border-[#48455a]/50 flex items-center justify-center">
              <MaterialIcon name={item.icon} className="text-[#ada3ff] text-2xl lg:text-3xl" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base lg:text-lg mb-1">
                {item.title}
              </h4>
              <p className="text-[#aca8c1] text-xs lg:text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}