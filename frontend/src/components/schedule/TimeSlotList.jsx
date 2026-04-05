"use client";

import { useState } from "react";
import AddSlotModal from "./AddSlotModal";
import EditSlotModal from "./EditSlotModal";

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

function TimeSlotItem({ slot, onSlotChange, onDeleteSlot }) {
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
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase mt-1 ${cfg.badgeBg} ${cfg.badgeText}`}>
              {badgeLabel}
            </span>
          </div>
        </div>

        {slot.status === "booked" ? (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-[#aca8c1] p-2 hover:text-[#e8e2fc] hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 mt-2 w-48 bg-[#1f1d35] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-1">
                <button 
                  onClick={() => { alert('Membuka Detail Klien: ' + slot.client); setShowMenu(false); }} 
                  className="w-full text-left px-4 py-2.5 text-sm text-[#e8e2fc] hover:bg-[#2c2945] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span> Detail Klien
                </button>
                <div className="h-[1px] bg-white/5 w-full my-1"></div>
                <button 
                  onClick={() => { onSlotChange(slot.id, "available"); setShowMenu(false); }} 
                  className="w-full text-left px-4 py-2.5 text-sm text-[#ff6e84] hover:bg-[#ff6e84]/10 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">event_busy</span> Batalkan Jadwal
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleAction}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${cfg.actionStyle}`}
          >
            {cfg.actionLabel}
          </button>
        )}
      </div>

      {/* Panggil Modal Edit Eksternal di Sini */}
      <EditSlotModal 
        isOpen={showEditModal} 
        slot={slot}
        onClose={() => setShowEditModal(false)}
        onSave={(newTime, newStatus) => {
          slot.time = newTime;
          onSlotChange(slot.id, newStatus);
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

export default function TimeSlotList({ slots, onSlotChange, onAddSlot, onDeleteSlot }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#e8e2fc] font-['Urbanist',sans-serif]">
          Kelola Slot Waktu
        </h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#6f59fe]/20 text-[#ada3ff] hover:bg-[#6f59fe] hover:text-white transition-all shadow-[0_0_15px_rgba(109,87,252,0.2)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot) => (
          <TimeSlotItem 
            key={slot.id} 
            slot={slot} 
            onSlotChange={onSlotChange} 
            onDeleteSlot={onDeleteSlot} 
          />
        ))}
        {slots.length === 0 && (
          <p className="text-center text-[#aca8c1] py-6 text-sm">Tidak ada jadwal tersimpan.</p>
        )}
      </div>

      {/* Panggil Modal Tambah Eksternal di Sini */}
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