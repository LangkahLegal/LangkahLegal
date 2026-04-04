"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, MaterialIcon } from "../ui";

// Data-driven navigation: memudahkan penambahan menu di masa depan
const NAV_LINKS = [
  { label: "Home", href: "/", active: true },
  { label: "Services", href: "#features", active: false },
  { label: "About", href: "#about", active: false },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0e0c1e]/70 backdrop-blur-xl border-b border-[#48455a]/30">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        {/* Brand / Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <MaterialIcon
            name="gavel"
            className="text-[#6f59fe] text-3xl transition-transform group-hover:rotate-12"
          />
          <span className="text-2xl font-bold tracking-tight text-[#e8e2fc] font-headline">
            LangkahLegal
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`font-headline transition-colors duration-300 ${
                link.active
                  ? "text-[#ada3ff] font-bold"
                  : "text-[#aca8c1] hover:text-[#ada3ff]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Button: Login / Get Started */}
        <div className="flex items-center">
          <Button
            onClick={() => router.push("/auth/login")}
            className="!w-auto !py-2.5 !px-6 text-sm font-bold"
          >
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}
