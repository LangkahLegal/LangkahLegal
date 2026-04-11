import { MaterialIcon } from "@/components/ui/Icons";

export default function HistoryCard({ item }) {
  const isActive = item.status === "Berlangsung";

  return (
    <div
      className={`group p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 ${
        isActive
          ? "bg-[#6f59fe]/10 border-[#6f59fe]/30 shadow-[0_10px_30px_rgba(111,89,254,0.1)]"
          : "bg-[#1f1d35]/50 border-white/5 hover:border-[#6f59fe]/20"
      }`}
    >
      {/* BAGIAN ATAS: Avatar & Info Dasar */}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden border-2 ${
              isActive ? "border-[#6f59fe]" : "border-white/10"
            }`}
          >
            <img
              src={item.avatar}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0e0c1e] rounded-full animate-pulse" />
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="truncate">
              <h3 className="font-bold text-sm sm:text-base text-[#e8e2fc] group-hover:text-white transition-colors truncate">
                {item.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-[#aca8c1] mt-0.5 truncate">
                {item.role}
              </p>
            </div>
            <span
              className={`inline-block w-fit text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                isActive
                  ? "bg-[#ada3ff] text-[#0e0c1e]"
                  : "bg-[#1f1d35] text-[#aca8c1]"
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>
      </div>

      {/* BAGIAN BAWAH: Action/Info */}
      <div className="mt-5 sm:mt-6 pt-4 border-t border-white/5 flex justify-between items-center gap-2">
        {isActive ? (
          <button className="flex items-center gap-1.5 sm:gap-2 text-[#ada3ff] font-bold text-[11px] sm:text-sm hover:gap-3 transition-all">
            <MaterialIcon name="videocam" className="text-base sm:text-lg" />
            <span className="truncate">Gabung Sesi</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#aca8c1] text-[10px] sm:text-xs font-medium">
            <MaterialIcon
              name="calendar_today"
              className="text-xs sm:text-sm"
            />
            <span className="truncate">{item.time}</span>
          </div>
        )}

        <button
          className={`flex items-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-sm transition-all shrink-0 ${
            isActive ? "text-white" : "text-[#aca8c1] hover:text-[#ada3ff]"
          }`}
        >
          {isActive ? (
            <MaterialIcon name="arrow_forward" className="text-lg sm:text-xl" />
          ) : (
            <>
              <span className="hidden sm:inline">Lihat Detail</span>    
              <MaterialIcon
                name="chevron_right"
                className="text-lg sm:text-xl"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
