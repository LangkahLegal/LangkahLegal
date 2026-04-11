"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/client-list/ClientCard";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

// Data Dummy agar tampilan sama dengan screenshot
const CLIENTS_LIST = [
  { id: 1, name: "Rizky Pratama", caseCategory: "Hukum Pidana", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Rizky Pratama", caseCategory: "Hukum Pidana", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, name: "Rizky Pratama", caseCategory: "Hukum Pidana", avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 4, name: "Rizky Pratama", caseCategory: "Hukum Pidana", avatar: "https://i.pravatar.cc/150?u=4" },
  { id: 5, name: "Rizky Pratama", caseCategory: "Hukum Pidana", avatar: "https://i.pravatar.cc/150?u=5" },
];

export default function ConsultantClientsPage() {
  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      {/* Sidebar Desktop */}
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Daftar Klien" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Stats Header sesuai foto */}
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-[0.2em]">
                  Total Klien Aktif
                </p>
                <h2 className="text-3xl font-black text-white">
                  24 <span className="text-[#ada3ff]">Klien</span>
                </h2>
              </div>
              
              {/* Filter Button pakai variant icon */}
              <Button 
                variant="icon" 
                className="!w-12 !h-12 !bg-[#1f1d35] !rounded-2xl border border-white/5 hover:!bg-[#6f59fe] group"
              >
                <MaterialIcon name="tune" className="text-[#ada3ff] group-hover:text-white transition-colors" />
              </Button>
            </div>

            {/* List Klien */}
            <div className="space-y-4">
              {CLIENTS_LIST.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </div>
        </main>

        {/* Navigation Mobile */}
        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}