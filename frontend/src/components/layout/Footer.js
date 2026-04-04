import Link from "next/link";
import { MaterialIcon } from "@/components/ui";

export default function Footer() {
  return (
    <footer className="bg-[#0e0c1e] w-full py-12 px-6 border-t border-outline-variant/5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <MaterialIcon name="gavel" className="text-[#6D57FC] text-2xl" />
            <span className="text-xl font-bold text-[#e8e2fc] font-headline">LangkahLegal</span>
          </div>
          <p className="text-[#aca8c1] text-sm leading-relaxed font-body">
            Platform legal-tech terdepan di Indonesia yang menghadirkan akses hukum yang mudah, transparan, dan terpercaya bagi semua kalangan.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-[#e8e2fc] font-bold font-headline">Company</h4>
          <Link href="#" className="text-[#aca8c1] hover:text-[#6D57FC] transition-colors text-sm font-body">About</Link>
          <Link href="#" className="text-[#aca8c1] hover:text-[#6D57FC] transition-colors text-sm font-body">Contact Us</Link>
          <Link href="#" className="text-[#aca8c1] hover:text-[#6D57FC] transition-colors text-sm font-body">Careers</Link>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-[#e8e2fc] font-bold font-headline">Legal</h4>
          <Link href="#" className="text-[#aca8c1] hover:text-[#6D57FC] transition-colors text-sm font-body">Terms of Service</Link>
          <Link href="#" className="text-[#aca8c1] hover:text-[#6D57FC] transition-colors text-sm font-body">Privacy Policy</Link>
          <Link href="#" className="text-[#aca8c1] hover:text-[#6D57FC] transition-colors text-sm font-body">Compliance</Link>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-[#e8e2fc] font-bold font-headline">Connect</h4>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer">
              <MaterialIcon name="share" className="text-[#ada3ff] text-xl" />
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer">
              <MaterialIcon name="public" className="text-[#ada3ff] text-xl" />
            </div>
          </div>
          <p className="text-[#aca8c1] text-xs font-body">
            © 2024 LangkahLegal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}