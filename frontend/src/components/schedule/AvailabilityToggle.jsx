import { Toggle } from "@/components/ui/Toggle";

export default function AvailabilityToggle({ isAvailable, onChange }) {
  return (
    <section>
      {/* Ubah rounded ke [2rem] dan padding ke p-6 agar sama dengan card lain */}
      <div className="bg-[#131125] rounded-[2rem] p-6 flex items-center justify-between border border-white/5 shadow-2xl">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white">
            Status Konsultasi
          </h3>

          <p className="text-xs text-[#aca8c1]">
            {isAvailable ? "Aktif Menerima Konsultasi" : "Tidak Menerima Konsultasi"}
          </p>
        </div>

        {/* Toggle switch */}
        <div className="scale-110"> {/* Sedikit scale agar lebih proporsional dengan card yang lebih besar */}
          <Toggle enabled={isAvailable} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}