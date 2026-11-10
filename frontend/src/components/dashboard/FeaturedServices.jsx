"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function FeaturedServices({ services }) {
  const { ai_service, small_services } = services;

  return (
    <section className="w-full space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base lg:text-lg font-headline font-bold text-main tracking-tight">
          Layanan Unggulan
        </h2>
      </div>

      {/* AI Card (Featured) - Horizontal Compact Layout */}
      <div className="bg-card border border-surface p-5 lg:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group relative overflow-hidden shadow-soft transition-all duration-500 hover:border-primary/20">
        <div className="flex items-start md:items-center gap-4 z-10 relative">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform group-hover:scale-105">
            <MaterialIcon
              name={ai_service.icon}
              className="text-2xl text-primary"
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg lg:text-xl font-headline font-bold text-main tracking-tight">
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
              className="!px-5 !py-2.5 w-full md:w-auto !rounded-full shadow-soft text-sm group-hover:gap-3"
            >
              <span>Coba Sekarang</span>
              <MaterialIcon name="east" className="text-base" />
            </Button>
          </Link>
        </div>

        {/* Dekorasi Ikon Melayang (Theme-Aware) */}
        <MaterialIcon
          name={ai_service.icon}
          className="absolute -bottom-6 -right-4 text-[7rem] text-primary/5 group-hover:scale-105 group-hover:rotate-12 transition-all duration-700 pointer-events-none"
        />
      </div>

      {/* Grid Services (Small Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:gap-4">
        {small_services.map((service, idx) => (
          <Link
            key={idx}
            href={service.href || "#"}
            className="bg-input border border-surface p-4 rounded-2xl flex items-center gap-3.5 hover:border-primary/30 hover:bg-surface transition-all duration-300 group/small"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-surface transition-colors group-hover/small:bg-primary/10">
              <MaterialIcon
                name={service.icon}
                className="text-xl text-primary-light"
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <h3 className="text-main font-bold text-sm group-hover/small:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted text-xs font-medium leading-relaxed">
                {service.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
