import { MaterialIcon } from "@/components/ui";

export default function VisiMisiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-10">
      {/* Card Visi */}
      <div className="relative overflow-hidden bg-white/5 border border-white/10 p-6 lg:p-8 rounded-[2rem] group transition-all duration-300 hover:border-[#6f59fe]/30">
        <MaterialIcon 
          name="visibility" 
          className="absolute top-4 right-4 text-[6rem] text-white/[0.03] -rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500" 
        />
        <h3 className="text-xl lg:text-2xl font-bold text-[#ada3ff] mb-4 relative z-10">
          Visi
        </h3>
        <p className="text-[#aca8c1] text-sm lg:text-base leading-relaxed relative z-10">
          Menjadi platform legal-tech terdepan di Indonesia yang menjembatani kesenjangan akses keadilan.
        </p>
      </div>

      {/* Card Misi */}
      <div className="relative overflow-hidden bg-[#261E58]/30 border border-white/10 p-6 lg:p-8 rounded-[2rem] group transition-all duration-300 hover:border-[#6f59fe]/30">
        <MaterialIcon 
          name="rocket_launch" 
          className="absolute top-4 right-4 text-[6rem] text-white/[0.03] rotate-12 pointer-events-none group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500" 
        />
        <h3 className="text-xl lg:text-2xl font-bold text-[#ada3ff] mb-4 relative z-10">
          Misi
        </h3>
        <p className="text-[#aca8c1] text-sm lg:text-base leading-relaxed relative z-10">
          Memberikan konsultasi hukum instan, aman, dan transparan bagi seluruh lapisan masyarakat tanpa terkecuali.
        </p>
      </div>
    </div>
  );
}