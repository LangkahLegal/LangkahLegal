"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import TimeSlotItem from "./TimeSlotItem";
import AddSlotModal from "./AddSlotModal";

export default function TimeSlotList({ slots, onSlotChange, onAddSlot, onUpdateSlot, onDeleteSlot }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-headline font-bold text-white">
          Kelola Slot Waktu
        </h2>
        {/* Menggunakan variant icon atau primary custom */}
        <Button 
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="!w-9 !h-9 !p-0 !rounded-full bg-[#6f59fe]/20 text-[#ada3ff] hover:bg-[#6f59fe] hover:text-white"
        >
          <span className="material-symbols-outlined text-xl">add</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot) => (
          <TimeSlotItem 
            key={slot.id} 
            slot={slot} 
            onSlotChange={onSlotChange} 
            onUpdateSlot={onUpdateSlot}
            onDeleteSlot={onDeleteSlot} 
          />
        ))}
        {slots.length === 0 && (
          <p className="text-center text-[#aca8c1] py-6 text-sm">Tidak ada jadwal tersimpan.</p>
        )}
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