"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function FeaturedServices({ services }) {
  const { ai_service, small_services } = services;

  return (
    <section className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-headline font-black text-main tracking-tight">
          Layanan Unggulan
        </h2>
        <Link href="#" passHref>
          <Button
            variant="ghost"
            className="!p-0 !text-primary-light hover:!bg-transparent hover:!text-primary font-bold"
          >
            Lihat Semua
          </Button>
        </Link>
      </div>

      {/* AI Card (Featured) - Menggunakan DNA yang sama dengan AIBanner */}
      <div className="bg-card border border-surface p-8 lg:p-10 rounded-[2.5rem] flex flex-col gap-6 group relative overflow-hidden shadow-soft transition-all duration-500 hover:border-primary/20">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform group-hover:scale-110">
          <MaterialIcon
            name={ai_service.icon}
            className="text-3xl text-primary"
          />
        </div>

        <div className="space-y-3 z-10 relative">
          <h3 className="text-2xl lg:text-3xl font-headline font-black text-main tracking-tight">
            {ai_service.title}
          </h3>
          <p className="text-muted text-sm lg:text-base leading-relaxed max-w-md font-medium">
            {ai_service.description}
          </p>
        </div>

        <div className="z-10">
          <Button
            variant="primary"
            className="!px-8 !rounded-full shadow-soft group-hover:gap-4"
          >
            <span>Coba Sekarang</span>
            <MaterialIcon name="east" className="text-xl" />
          </Button>
        </div>

        {/* Dekorasi Ikon Melayang (Theme-Aware) */}
        <MaterialIcon
          name={ai_service.icon}
          className="absolute -bottom-6 -right-6 text-[10rem] text-primary/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none"
        />
      </div>

      {/* Grid Services (Small Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {small_services.map((service, idx) => (
          <div
            key={idx}
            className="bg-input border border-surface p-6 rounded-2xl flex items-start gap-4 hover:border-primary/30 hover:bg-surface transition-all duration-300 group/small"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-surface transition-colors group-hover/small:bg-primary/10">
              <MaterialIcon
                name={service.icon}
                className="text-2xl text-primary-light"
              />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-main font-bold text-sm lg:text-base group-hover/small:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted text-xs lg:text-sm font-medium leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
