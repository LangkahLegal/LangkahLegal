import Link from "next/link";
import { BrandLogo } from "@/components/ui";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg w-full pt-16 pb-8 px-6 border-t border-surface transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-10">
          <div className="space-y-6 lg:col-span-1">
            <div className="flex items-center gap-2">
              <BrandLogo iconSize="text-2xl" textSize="text-xl" />
            </div>
            <p className="text-muted text-sm leading-relaxed text-justify md:text-left">
              Platform legal-tech terdepan yang mendigitalisasi akses keadilan
              di Indonesia. Menjembatani masyarakat awam dan tenaga ahli hukum
              secara cerdas, aman, dan transparan untuk mewujudkan SDG 16.3.
            </p>
          </div>  
        </div>

        {/* Bagian Bawah: Copyright (Sesuai Gambar) */}
        <div className="pt-8 border-t border-surface/50">
          <p className="text-muted text-sm">
            © {currentYear} LangkahLegal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
