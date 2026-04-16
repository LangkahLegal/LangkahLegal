export default function ClientHero({ name, avatar, fallback }) {
  return (
    <div className="flex flex-col items-center justify-center pt-4 pb-8 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#6f59fe]/20 blur-[80px] -z-10 rounded-full" />
      <div className="relative mb-4 sm:mb-6">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[6px] border-[#6f59fe]/10 p-1.5 backdrop-blur-sm shadow-inner bg-[#0e0c1e]/50">
          <div className="w-full h-full rounded-full border-2 border-[#6f59fe] p-1 bg-[#1f1d35]">
            <img 
              src={avatar || fallback} 
              alt={name} 
              className="w-full h-full rounded-full object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
      <div className="relative z-10 text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight px-2">
          {name}
        </h2>
      </div>
    </div>
  );
}