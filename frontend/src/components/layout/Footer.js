import Link from "next/link";
import { MaterialIcon, BrandLogo } from "@/components/ui";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg w-full py-12 px-6 border-t border-surface transition-colors duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BrandLogo iconSize="text-2xl" textSize="text-xl" />
          </div>
          <p className="text-muted text-sm leading-relaxed">
            Platform legal-tech terdepan di Indonesia yang menghadirkan akses hukum yang mudah, transparan, dan terpercaya bagi semua kalangan.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-main font-bold font-headline">LangkahLegal</h4>
          <Link href="/about" className="text-muted hover:text-primary transition-colors text-sm">Tentang Kami</Link>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-main font-bold font-headline">Informasi Hukum</h4>
          <Link href="/terms" className="text-muted hover:text-primary transition-colors text-sm">Syarat & Ketentuan</Link>
          <Link href="/privacy" className="text-muted hover:text-primary transition-colors text-sm">Kebijakan Privasi</Link>
          <Link href="/compliance" className="text-muted hover:text-primary transition-colors text-sm">Kepatuhan Hukum</Link>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-main font-bold font-headline">Kontak</h4>
          <div className="flex flex-col gap-4">
            <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=langkahlegal@gmail.com"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted hover:text-primary transition-colors cursor-pointer group" 
                title="Email LangkahLegal"
              >
              <div className="w-10 h-10 rounded-full bg-surface border border-surface flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="group-hover:text-primary-light transition-colors"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <span className="text-sm font-medium">langkahlegal@gmail.com</span>
            </a>
          </div>
          <p className="text-muted text-xs">
            © {currentYear} LangkahLegal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}