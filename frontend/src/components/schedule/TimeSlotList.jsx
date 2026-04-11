"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import TimeSlotItem from "./TimeSlotItem";
import AddSlotModal from "./AddSlotModal";

export default function TimeSlotList({ slots, onSlotChange, onAddSlot, onUpdateSlot, onDeleteSlot }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <section>
      {/* Container Card Utama */}
      <div className="bg-[#131125] rounded-[2rem] p-6 shadow-2xl border border-white/5">
        
        {/* Header*/}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white">
              Kelola Slot Waktu
            </h2>
            <p className="text-xs text-[#aca8c1]">
              Atur jam operasional harian Anda
            </p>
          </div>

          <Button 
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="!w-10 !h-10 !p-0 !rounded-2xl bg-[#6f59fe]/20 text-[#ada3ff] hover:bg-[#6f59fe] hover:text-white transition-all duration-300"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </Button>
        </div>

        {/* List Slot */}
        <div className="space-y-4">
          {slots.length > 0 ? (
            slots.map((slot) => (
              <TimeSlotItem 
                key={slot.id} 
                slot={slot} 
                onSlotChange={onSlotChange} 
                onUpdateSlot={onUpdateSlot}
                onDeleteSlot={onDeleteSlot} 
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-white/10 rounded-3xl bg-white/5">
              <span className="material-symbols-outlined text-[#48455a] text-4xl mb-2">
                event_busy
              </span>
              <p className="text-center text-[#aca8c1] text-xs">
                Belum ada jadwal tersimpan untuk tanggal ini.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddSlotModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSave={(newSlotData) => {
          onAddSlot(newSlotData);
          setShowAddModal(false);
        }}
      />
    </section>
  );
}