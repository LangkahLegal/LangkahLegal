import Link from "next/link";
import { MaterialIcon, BrandLogo } from "@/components/ui";

export default function Footer() {
  return (
    <footer className="bg-dark w-full py-12 px-6 border-t border-muted/10">
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
          <h4 className="text-main font-bold font-headline">Company</h4>
          <Link href="#" className="text-muted hover:text-primary transition-colors text-sm">About</Link>
          <Link href="#" className="text-muted hover:text-primary transition-colors text-sm">Contact Us</Link>
          <Link href="#" className="text-muted hover:text-primary transition-colors text-sm">Careers</Link>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-main font-bold font-headline">Legal</h4>
          <Link href="#" className="text-muted hover:text-primary transition-colors text-sm">Terms of Service</Link>
          <Link href="#" className="text-muted hover:text-primary transition-colors text-sm">Privacy Policy</Link>
          <Link href="#" className="text-muted hover:text-primary transition-colors text-sm">Compliance</Link>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-main font-bold font-headline">Connect</h4>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer">
              <MaterialIcon name="share" className="text-primary-light text-xl" />
            </div>
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer">
              <MaterialIcon name="public" className="text-primary-light text-xl" />
            </div>
          </div>
          <p className="text-muted text-xs">
            © 2026 LangkahLegal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}