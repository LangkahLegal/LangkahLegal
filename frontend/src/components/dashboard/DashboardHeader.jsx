import { MaterialIcon } from "@/components/ui";

export default function DashboardHeader({ userName, avatarUrl }) {
  return (
    <section
      className="
        /* Layout Dasar */
        flex justify-between items-center w-full transition-all duration-300
        
        /* Mobile: Padding standar */
        px-6 py-4 pb-6 
        
        /* Web/Desktop: Padding lebih luas & Sticky */
        lg:px-10 lg:py-6 
        
        /* Styling & Glassmorphism */
        border-b border-white/5 
        bg-[#0e0c1e]/40 backdrop-blur-md
        shadow-[0_15px_40px_-20px_rgba(255,255,255,0.1)]
      "
    >
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        <div
          className="
          w-10 h-10 lg:w-14 lg:h-14 
          rounded-full overflow-hidden 
          bg-white/20 border-2 border-white/30 
          shadow-[0_0_15px_rgba(255,255,255,0.1)]
          transition-all
        "
        >
          <img
            src={avatarUrl}
            alt={userName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Sapaan Teks */}
        <div className="space-y-0.5">
          <span className="text-[#aca8c1] text-xs lg:text-sm font-medium">
            Halo,
          </span>
          <h2 className="text-lg lg:text-2xl font-headline font-bold text-white tracking-tight">
            {userName}
          </h2>
        </div>
      </div>

      {/* Settings Button */}
      <div className="flex items-center gap-3">
        <button
          className="
          btn-icon bg-white/5 hover:bg-white/10 
          p-2 lg:p-3 rounded-full 
          transition-all group
        "
        >
          <MaterialIcon
            name="settings"
            className="text-[#aca8c1] group-hover:text-white group-hover:rotate-45 transition-all duration-500 text-xl lg:text-2xl"
          />
        </button>
      </div>
    </section>
  );
}
