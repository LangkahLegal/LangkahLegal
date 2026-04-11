"use client";

import { useState } from "react";
import EditSlotModal from "./EditSlotModal";
import { Button } from "@/components/ui";

const STATUS_CONFIG = {
  available: {
    icon: "schedule",
    iconColor: "text-[#ada3ff]",
    iconBg: "bg-[#ada3ff]/10",
    badge: "TERSEDIA",
    badgeBg: "bg-[#ada3ff]/10",
    badgeText: "text-[#ada3ff]",
    actionLabel: "Ubah",
    actionStyle: "bg-[#2c2945] text-[#aca8c1] hover:bg-[#ada3ff] hover:text-white",
    wrapperStyle: "",
  },
  booked: {
    icon: "person",
    iconColor: "text-[#c0b5ff]",
    iconBg: "bg-[#c0b5ff]/10",
    badge: null,
    badgeBg: "bg-[#c0b5ff]/20",
    badgeText: "text-[#c0b5ff]",
    actionLabel: null,
    actionStyle: "text-[#aca8c1]",
    wrapperStyle: "opacity-80",
  },
  off: {
    icon: "block",
    iconColor: "text-[#ff6e84]",
    iconBg: "bg-[#ff6e84]/10",
    badge: "LIBUR",
    badgeBg: "bg-[#ff6e84]/10",
    badgeText: "text-[#ff6e84]",
    actionLabel: "Aktifkan",
    actionStyle: "bg-[#2c2945] text-[#aca8c1] hover:bg-[#ff6e84]/20",
    wrapperStyle: "opacity-60 grayscale-[0.5]",
  },
};

export default function TimeSlotItem({ slot, onSlotChange, onUpdateSlot, onDeleteSlot }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); 

  const cfg = STATUS_CONFIG[slot.status];
  const badgeLabel = slot.status === "booked" ? `Terisi (${slot.client})` : cfg.badge;

  const handleAction = () => {
    if (slot.status === "available") {
      setShowEditModal(true);
    } else if (slot.status === "off") {
      onSlotChange(slot.id, "available");
    }
  };

  return (
    <>
      <div className={`rounded-2xl p-4 flex items-center justify-between border border-white/5 transition-all bg-[rgba(25,23,45,0.7)] backdrop-blur-xl ${cfg.wrapperStyle}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
            <span className={`material-symbols-outlined ${cfg.iconColor}`}>{cfg.icon}</span>
          </div>
          <div>
            <p className="text-base font-bold text-[#e8e2fc]">{slot.time}</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase mt-1 ${cfg.badgeBg} ${cfg.badgeText}`}>
              {badgeLabel}
            </span>
          </div>
        </div>

        {slot.status === "booked" ? (
          <div className="relative">
            <Button 
              variant="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </Button>
            {/* ... rest of menu logic ... */}
          </div>
        ) : (
          <Button
            variant="secondary" // Gunakan base secondary
            onClick={handleAction}
            className={`px-4 py-2 text-xs !rounded-xl ${cfg.actionStyle}`}
          >
            {cfg.actionLabel}
          </Button>
        )}
      </div>

      <EditSlotModal
        isOpen={showEditModal}
        slot={slot}
        onClose={() => setShowEditModal(false)}
        onSave={(newTime, newStatus) => {
          onUpdateSlot(slot.id, newTime, newStatus);
          setShowEditModal(false);
        }}
        onDelete={() => {
          onDeleteSlot(slot.id);
          setShowEditModal(false);
        }}
      />
    </>
  );
}