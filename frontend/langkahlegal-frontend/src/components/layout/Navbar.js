"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, MaterialIcon } from "@/components/ui";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0e0c1e]/70 backdrop-blur-xl border-b border-[#48455a]/30">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <MaterialIcon name="gavel" className="text-[#6f59fe] text-3xl" />
          <span className="text-2xl font-bold tracking-tight text-[#e8e2fc] font-headline">LangkahLegal</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-[#ada3ff] font-bold font-headline transition-colors duration-300">Home</Link>
          <Link href="#features" className="text-[#aca8c1] hover:text-[#ada3ff] transition-colors duration-300 font-headline">Services</Link>
          <Link href="#about" className="text-[#aca8c1] hover:text-[#ada3ff] transition-colors duration-300 font-headline">About</Link>
        </div>
        
        {/* Menggunakan Button dari ui.js + Router */}
        <Button onClick={() => router.push('/auth/role')} className="!w-auto !py-2 !px-6 text-sm">
          Get Started
        </Button>
      </div>
    </nav>
  );
}