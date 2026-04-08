import { MaterialIcon } from "@/components/ui/Icons";

export default function ChatHeader() {
  return (
    <header className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-[#0e0c1e]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 border-[#6f59fe]/30">
            <img
              src="https://i.pravatar.cc/150?u=kia"
              alt="Kia AI"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0e0c1e] rounded-full" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg lg:text-xl leading-tight">
            Kia
          </h1>
          <p className="text-emerald-500 text-[10px] lg:text-xs font-bold tracking-widest uppercase">
            Online
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-[#aca8c1] hover:text-white p-2 transition-colors">
          <MaterialIcon name="search" />
        </button>
        <button className="text-[#aca8c1] hover:text-white p-2 transition-colors">
          <MaterialIcon name="more_vert" />
        </button>
      </div>
    </header>
  );
}
