"use client";

import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import Link from "next/link";

export default function ClientCard({ client }) {
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=1f1d35&color=ada3ff`;

  return (
    <div className="bg-[#1f1d35]/50 border border-white/5 rounded-[2rem] p-4 flex items-center justify-between hover:border-[#6f59fe]/30 transition-colors group shadow-lg">
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
        {/* Avatar Area */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1f1d35] shadow-xl">
            <img 
              src={client.avatar || fallbackAvatar} 
              alt={client.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1f1d35] rounded-full shadow-lg" />
        </div>

        {/* Info Area */}
        <div className="min-w-0">
          <h3 className="font-bold text-[#e8e2fc] text-base group-hover:text-white transition-colors truncate">
            {client.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <MaterialIcon name="event_note" className="text-[14px] text-[#ada3ff] mt-0.5 shrink-0" />
            
            <div className="flex flex-col pt-0.5">
              {/* Tanggal */}
              <p className="text-[10px] text-[#ada3ff] font-bold uppercase tracking-wider leading-none">
                {client.date}
              </p>
              {/* Jam */}
              <p className="text-[10px] text-[#aca8c1] font-medium leading-none mt-0.5">
                {client.startTime} - {client.endTime} WIB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <Link href={`/client-list/${client.id}`} className="shrink-0">
        <Button 
          variant="secondary" 
          className="!text-[11px] !font-bold !px-5 !py-2 !rounded-xl !bg-[#2c2945] hover:!bg-[#6f59fe] hover:!text-white transition-colors shadow-md active:scale-95"
        >
          Detail
        </Button>
      </Link>
    </div>
  );
}