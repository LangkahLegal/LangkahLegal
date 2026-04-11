"use client";

import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

export default function ClientCard({ client }) {
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=1f1d35&color=ada3ff`;

  return (
    <div className="bg-[#1f1d35]/50 border border-white/5 rounded-[2rem] p-4 flex items-center justify-between hover:border-[#6f59fe]/30 transition-all group shadow-lg">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1f1d35] shadow-xl">
            <img 
              src={client.avatar || fallbackAvatar} 
              alt={client.name} 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Green Dot Online */}
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1f1d35] rounded-full shadow-lg" />
        </div>

        {/* Info Klien */}
        <div className="min-w-0">
          <h3 className="font-bold text-[#e8e2fc] text-base group-hover:text-white transition-colors truncate">
            {client.name}
          </h3>
          <p className="text-[10px] text-[#ada3ff] font-black uppercase tracking-[0.1em] mt-0.5 opacity-80">
            {client.caseCategory}
          </p>
        </div>
      </div>

      {/* Button Detail*/}
      <Button 
        variant="secondary" 
        className="!text-[11px] !font-bold !px-5 !py-2 !rounded-xl !bg-[#2c2945] hover:!bg-[#6f59fe] hover:!text-white transition-all shadow-md active:scale-95"
      >
        Detail
      </Button>
    </div>
  );
}