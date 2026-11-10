"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui";

const FITUR_LINKS = [
  { label: "Tanya AI", href: "/ai" },
  { label: "Cari Konsultan", href: "/explore" },
  { label: "Bursa Kasus", href: "/bursa" },
  { label: "Pusat Edukasi", href: "/knowledge" },
];

const TENTANG_LINKS = [
  { label: "Tentang Kami", href: "/about" },
  { label: "FAQ", href: "/#faq" },
  { label: "Daftar Jadi Konsultan", href: "/auth/role" },
];

const LEGAL_LINKS = [
  { label: "Syarat & Ketentuan", href: "/terms" },
  { label: "Kebijakan Privasi", href: "/privacy" },
  { label: "Kepatuhan Regulasi", href: "/compliance" },
];

const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://linkedin.com" },
  { name: "Instagram", href: "https://instagram.com" },
  { name: "Twitter/X", href: "https://twitter.com" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface/40 transition-colors duration-500 pt-16 pb-8 px-6 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Kolom Brand & Deskripsi Singkat */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo iconSize="w-8 h-8" textSize="text-xl" />
            <p className="text-muted text-sm leading-relaxed max-w-sm">
              Platform legal-tech yang mendigitalisasi akses keadilan di
              Indonesia. Menghubungkan masyarakat dengan praktisi hukum
              terpercaya.
            </p>
            <p className="text-xs text-muted/80">
              Jakarta, Indonesia •{" "}
              <a
                href="mailto:halo@langkahlegal.id"
                className="hover:text-primary-text transition-colors"
              >
                halo@langkahlegal.id
              </a>
            </p>
          </div>

          {/* Kolom Fitur */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-main font-headline">
              Fitur
            </h4>
            <ul className="space-y-2 text-sm">
              {FITUR_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-main transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom Tentang */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-main font-headline">
              Tentang
            </h4>
            <ul className="space-y-2 text-sm">
              {TENTANG_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-main transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom Kebijakan */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-main font-headline">
              Kebijakan
            </h4>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-main transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bawah: Copyright & Sosmed */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© {currentYear} LangkahLegal. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-primary-text transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
