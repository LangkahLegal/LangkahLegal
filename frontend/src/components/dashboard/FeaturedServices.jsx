import Link from "next/link";
import { MaterialIcon } from "@/components/ui";

export default function FeaturedServices({ services }) {
  const { ai_service, small_services } = services;

  return (
    <section className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-headline font-bold text-white">
          Layanan Unggulan
        </h2>
        <Link
          href="#"
          className="text-[#aca8c1] hover:text-[#ada3ff] text-xs font-semibold"
        >
          Lihat Semua
        </Link>
      </div>

      {/* AI Card */}
      <div className="glass-card bg-[#1f1d35] border border-[#48455a]/30 p-8 rounded-2xl flex flex-col gap-6 group relative overflow-hidden">
        <div className="w-12 h-12 rounded-xl bg-[#6f59fe]/20 flex items-center justify-center">
          <MaterialIcon
            name={ai_service.icon}
            className="text-3xl text-[#6f59fe]"
          />
        </div>
        <div className="space-y-2 z-10">
          <h3 className="text-2xl font-headline font-bold text-white">
            {ai_service.title}
          </h3>
          <p className="text-[#aca8c1] text-sm leading-relaxed">
            {ai_service.description}
          </p>
        </div>
        <button className="flex items-center gap-2 text-[#ada3ff] font-semibold text-xs group-hover:gap-3 transition-all">
          <span>Coba Sekarang</span>
          <MaterialIcon name="east" className="text-lg" />
        </button>
        <MaterialIcon
          name={ai_service.icon}
          className="absolute -bottom-2 -right-2 text-8xl text-[#48455a]/10 group-hover:scale-110 transition-transform"
        />
      </div>

      {/* Grid Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {small_services.map((service, idx) => (
          <div
            key={idx}
            className="glass-card bg-[#1f1d35] border border-[#48455a]/30 p-6 rounded-2xl flex items-start gap-4 hover:border-[#ada3ff]/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-[#6f59fe]/10 flex items-center justify-center">
              <MaterialIcon
                name={service.icon}
                className="text-3xl text-[#ada3ff]"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-[#e8e2fc] font-bold text-sm">
                {service.title}
              </h3>
              <p className="text-[#aca8c1] text-xs">{service.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
