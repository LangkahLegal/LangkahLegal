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
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-8 bg-[#25233d] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-br peer-checked:from-[#6f59fe] peer-checked:to-[#ada3ff]"
          />
        </label>
      </div>
    </section>
  );
}