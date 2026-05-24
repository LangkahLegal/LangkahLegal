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
      </div>

      {/* AI Card (Featured) - Horizontal Compact Layout */}
      <div className="bg-card border border-surface p-6 lg:p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group relative overflow-hidden shadow-soft transition-all duration-500 hover:border-primary/20">
        <div className="flex items-start md:items-center gap-5 z-10 relative">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform group-hover:scale-110">
            <MaterialIcon
              name={ai_service.icon}
              className="text-3xl text-primary"
            />
          </div>

          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xl lg:text-2xl font-headline font-black text-main tracking-tight">
              {ai_service.title}
            </h3>
            <p className="text-muted text-xs lg:text-sm leading-relaxed max-w-md font-medium">
              {ai_service.description}
            </p>
          </div>
        </div>

        <div className="z-10 w-full md:w-auto">
          <Link href={ai_service.href || "/ai"} passHref>
            <Button
              variant="primary"
              className="!px-6 !py-3 w-full md:w-auto !rounded-full shadow-soft group-hover:gap-4"
            >
              <span>Coba Sekarang</span>
              <MaterialIcon name="east" className="text-lg" />
            </Button>
          </Link>
        </div>

        {/* Dekorasi Ikon Melayang (Theme-Aware) */}
        <MaterialIcon
          name={ai_service.icon}
          className="absolute -bottom-10 -right-6 text-[10rem] text-primary/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none"
        />
      </div>

      {/* Grid Services (Small Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {small_services.map((service, idx) => (
          <Link
            key={idx}
            href={service.href || "#"}
            className="bg-input border border-surface p-4 lg:p-5 rounded-2xl flex items-center gap-4 hover:border-primary/30 hover:bg-surface transition-all duration-300 group/small"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-surface transition-colors group-hover/small:bg-primary/10">
              <MaterialIcon
                name={service.icon}
                className="text-xl lg:text-2xl text-primary-light"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <h3 className="text-main font-bold text-sm lg:text-base group-hover/small:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted text-[11px] lg:text-xs font-medium leading-relaxed">
                {service.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
