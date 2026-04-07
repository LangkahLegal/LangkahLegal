"use client";

import { useState } from "react";

const TIME_OPTIONS = Array.from({ length: 33 }).map((_, i) => {
  const hr = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? "00" : "30";
  return `${hr.toString().padStart(2, "0")}:${min}`;
});

export default function AddSlotModal({ isOpen, onClose, onSave }) {
  const [newStartTime, setNewStartTime] = useState("08:00");
  const [newEndTime, setNewEndTime] = useState("09:00");
  const [newStatus, setNewStatus] = useState("available");
  const [openAddDropdown, setOpenAddDropdown] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      time: `${newStartTime} - ${newEndTime}`,
      status: newStatus,
    });
    // Reset form
    setNewStartTime("08:00");
    setNewEndTime("09:00");
    setNewStatus("available");
    setOpenAddDropdown(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0c1e]/80 backdrop-blur-sm px-6">
      <div className="bg-[#1f1d35] rounded-3xl p-6 w-full max-w-sm border border-[#48455a]/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#e8e2fc] font-['Urbanist',sans-serif]">Tambah Jadwal Baru</h3>
          <button onClick={onClose} className="text-[#aca8c1] hover:text-[#ff6e84] transition-colors cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider block mb-1.5">Mulai</label>
              <button 
                onClick={() => setOpenAddDropdown(openAddDropdown === "start" ? null : "start")}
                className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50 transition-colors"
              >
                {newStartTime}
                <span className="material-symbols-outlined text-[#aca8c1] text-[18px]">expand_more</span>
              </button>
              {openAddDropdown === "start" && (
                <div className="absolute left-0 right-0 top-[100%] mt-1 max-h-48 overflow-y-auto bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] py-1 custom-scrollbar">
                  {TIME_OPTIONS.map(t => (
                    <div key={t} onClick={() => { setNewStartTime(t); setOpenAddDropdown(null); }} className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#6f59fe]/20 ${newStartTime === t ? "text-[#ada3ff] font-bold" : "text-[#e8e2fc]"}`}>
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
                onClick={() => setOpenAddDropdown(openAddDropdown === "end" ? null : "end")}
                className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50 transition-colors"
              >
                {newEndTime}
                <span className="material-symbols-outlined text-[#aca8c1] text-[18px]">expand_more</span>
              </button>
              {openAddDropdown === "end" && (
                <div className="absolute left-0 right-0 top-[100%] mt-1 max-h-48 overflow-y-auto bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] py-1 custom-scrollbar">
                  {TIME_OPTIONS.map(t => (
                    <div key={t} onClick={() => { setNewEndTime(t); setOpenAddDropdown(null); }} className={`px-4 py-2 text-sm cursor-pointer hover:bg-[#6f59fe]/20 ${newEndTime === t ? "text-[#ada3ff] font-bold" : "text-[#e8e2fc]"}`}>
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
              onClick={() => setOpenAddDropdown(openAddDropdown === "status" ? null : "status")}
              className="w-full bg-[#131125] border border-white/5 rounded-xl px-4 py-3 text-[#e8e2fc] outline-none transition-colors flex justify-between items-center cursor-pointer hover:border-[#6f59fe]/50"
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${newStatus === "available" ? "text-[#ada3ff]" : "text-[#ff6e84]"}`}>
                  {newStatus === "available" ? "schedule" : "block"}
                </span>
                <span>{newStatus === "available" ? "Tersedia" : "Libur / Tutup"}</span>
              </div>
              <span className="material-symbols-outlined text-[#aca8c1]">expand_more</span>
            </button>
            {openAddDropdown === "status" && (
              <div className="absolute left-0 right-0 top-[105%] bg-[#25233d] border border-white/10 rounded-xl shadow-2xl z-[110] overflow-hidden py-1">
                <div onClick={() => { setNewStatus("available"); setOpenAddDropdown(null); }} className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${newStatus === "available" ? "bg-[#6f59fe]/20 text-[#ada3ff]" : "text-[#e8e2fc] hover:bg-[#131125]"}`}>
                  <span className="material-symbols-outlined text-[18px]">schedule</span> Tersedia
                </div>
                <div onClick={() => { setNewStatus("off"); setOpenAddDropdown(null); }} className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${newStatus === "off" ? "bg-[#ff6e84]/20 text-[#ff6e84]" : "text-[#e8e2fc] hover:bg-[#131125]"}`}>
                  <span className="material-symbols-outlined text-[18px]">block</span> Libur / Tutup
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/5 text-[#e8e2fc] hover:bg-white/10 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#6f59fe] text-white hover:bg-[#5b48d9] transition-colors cursor-pointer shadow-[0_0_15px_rgba(109,87,252,0.4)]"
          >
            Tambah Jadwal
          </button>
        </div>
      </div>
    </div>
  );
}