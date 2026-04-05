"use client";

import { useState } from "react";

const TIME_OPTIONS = Array.from({ length: 33 }).map((_, i) => {
  const hr = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? "00" : "30";
  return `${hr.toString().padStart(2, "0")}:${min}`;
});

export default function EditSlotModal({ isOpen, onClose, onSave, onDelete, slot }) {
  const [initialStart, initialEnd] = slot?.time?.split(" - ") || ["09:00", "10:00"];
  
  const [editStartTime, setEditStartTime] = useState(initialStart);
  const [editEndTime, setEditEndTime] = useState(initialEnd);
  const [editStatus, setEditStatus] = useState(slot?.status || "available");
  const [openDropdown, setOpenDropdown] = useState(null);

  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0c1e]/80 backdrop-blur-sm px-6">
      <div className="bg-[#1f1d35] rounded-3xl p-6 w-full max-w-sm border border-[#48455a]/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#e8e2fc] font-['Urbanist',sans-serif]">Ubah Jadwal</h3>
          <button onClick={onClose} className="text-[#aca8c1] hover:text-[#ff6e84] transition-colors cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider block mb-1.5">Mulai</label>
              <button 
                onClick={() => setOpenDropdown(openDropdown === "start" ? null : "start")}
                className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50 transition-colors"
              >
                {editStartTime}
                <span className="material-symbols-outlined text-[#aca8c1] text-[18px]">expand_more</span>
              </button>
              {openDropdown === "start" && (
                <div className="absolute left-0 right-0 top-[100%] mt-1 max-h-48 overflow-y-auto bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] py-1 custom-scrollbar">
                  {TIME_OPTIONS.map(t => (
                    <div key={t} onClick={() => { setEditStartTime(t); setOpenDropdown(null); }} className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#6f59fe]/20 ${editStartTime === t ? "text-[#ada3ff] font-bold" : "text-[#e8e2fc]"}`}>
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[#aca8c1] mt-5 font-bold">-</span>
            <div className="flex-1 relative">
              <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider block mb-1.5">Selesai</label>
              <button 
                onClick={() => setOpenDropdown(openDropdown === "end" ? null : "end")}
                className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50 transition-colors"
              >
                {editEndTime}
                <span className="material-symbols-outlined text-[#aca8c1] text-[18px]">expand_more</span>
              </button>
              {openDropdown === "end" && (
                <div className="absolute left-0 right-0 top-[100%] mt-1 max-h-48 overflow-y-auto bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] py-1 custom-scrollbar">
                  {TIME_OPTIONS.map(t => (
                    <div key={t} onClick={() => { setEditEndTime(t); setOpenDropdown(null); }} className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#6f59fe]/20 ${editEndTime === t ? "text-[#ada3ff] font-bold" : "text-[#e8e2fc]"}`}>
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider block mb-1.5">Status Slot</label>
            <button 
              onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
              className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none transition-colors flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50"
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${editStatus === "available" ? "text-[#ada3ff]" : "text-[#ff6e84]"}`}>
                  {editStatus === "available" ? "schedule" : "block"}
                </span>
                <span>{editStatus === "available" ? "Tersedia" : "Libur / Tutup"}</span>
              </div>
              <span className="material-symbols-outlined text-[#aca8c1]">expand_more</span>
            </button>
            {openDropdown === "status" && (
              <div className="absolute left-0 right-0 top-[105%] bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] overflow-hidden py-1">
                <div onClick={() => { setEditStatus("available"); setOpenDropdown(null); }} className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${editStatus === "available" ? "bg-[#6f59fe]/20 text-[#ada3ff]" : "text-[#e8e2fc] hover:bg-[#131125]"}`}>
                  <span className="material-symbols-outlined text-[18px]">schedule</span> Tersedia
                </div>
                <div onClick={() => { setEditStatus("off"); setOpenDropdown(null); }} className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${editStatus === "off" ? "bg-[#ff6e84]/20 text-[#ff6e84]" : "text-[#e8e2fc] hover:bg-[#131125]"}`}>
                  <span className="material-symbols-outlined text-[18px]">block</span> Libur / Tutup
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 text-[#e8e2fc] hover:bg-white/10 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              onClick={() => onSave(`${editStartTime} - ${editEndTime}`, editStatus)} 
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#6f59fe] text-white hover:bg-[#5b48d9] transition-colors cursor-pointer shadow-[0_0_15px_rgba(109,87,252,0.4)]"
            >
              Simpan
            </button>
          </div>
          <button 
            onClick={onDelete}
            className="w-full py-3 rounded-xl text-sm font-semibold border border-[#ff6e84]/30 text-[#ff6e84] hover:bg-[#ff6e84]/10 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Hapus Jadwal Ini
          </button>
        </div>
      </div>
    </div>
  );
}