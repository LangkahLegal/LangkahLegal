import Link from "next/link";
import { MaterialIcon } from "@/components/ui";

export default function FeaturedServices({ services }) {
  const { ai_service, small_services } = services;

  return (
    <section className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-headline font-bold text-main">
          Layanan Unggulan
        </h2>
        <Link
          href="#"
          className="text-primary-light hover:text-primary-light text-s font-semibold"
        >
          Lihat Semua
        </Link>
      </div>

      {/* AI Card */}
      <div className="glass-card bg-input border border-muted/30 p-8 rounded-2xl flex flex-col gap-6 group relative overflow-hidden">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <MaterialIcon
            name={ai_service.icon}
            className="text-3xl text-primary"
          />
        </div>
        <div className="space-y-2 z-10">
          <h3 className="text-2xl font-headline font-bold text-main">
            {ai_service.title}
          </h3>
          <p className="text-muted text-sm leading-relaxed">
            {ai_service.description}
          </p>
        </div>
        <button className="flex items-center gap-2 text-primary-light font-semibold text-xs group-hover:gap-3 transition-all">
          <span>Coba Sekarang</span>
          <MaterialIcon name="east" className="text-lg" />
        </button>
        <MaterialIcon
          name={ai_service.icon}
          className="absolute -bottom-2 -right-2 text-8xl text-muted/10 group-hover:scale-110 transition-transform"
        />
      </div>

      {/* Grid Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {small_services.map((service, idx) => (
          <div
            key={idx}
            className="glass-card bg-input border border-muted/30 p-6 rounded-2xl flex items-start gap-4 hover:border-primary-light/30 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MaterialIcon
                name={service.icon}
                className="text-3xl text-primary-light"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-main font-bold text-sm">
                {service.title}
              </h3>
              <p className="text-muted text-xs">{service.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}