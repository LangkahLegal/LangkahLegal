import { Toggle } from "@/components/ui/Toggle";

export default function AvailabilityToggle({ isAvailable, onChange }) {
  return (
    <section>
      <div className="bg-[#131125] rounded-3xl p-5 flex items-center justify-between border border-[#48455a]/10">
        <div className="flex flex-col">
          <h3 className="text-base font-bold text-[#e8e2fc]">
            Status Konsultasi
          </h3>
          <p className="text-xs text-[#aca8c1]">
            {isAvailable ? "Aktif Menerima Konsultasi" : "Tidak Menerima Konsultasi"}
          </p>
        </div>

        {/* Toggle switch */}
        <Toggle enabled={isAvailable} onChange={onChange} />
      </div>
    </section>
  );
}