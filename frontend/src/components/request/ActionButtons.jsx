import { MaterialIcon } from "@/components/ui/Icons";

export default function ActionButtons({ onReject, onAccept }) {
  return (
    <div className="flex gap-4 pt-4">
      <button
        onClick={onReject}
        className="flex-1 h-14 rounded-2xl border border-white/5 bg-[#19172D] hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-2 text-white font-bold text-sm group"
      >
        <MaterialIcon
          name="close"
          className="text-red-500 group-hover:text-white transition-colors"
        />
        Tolak
      </button>

      <button
        onClick={onAccept}
        className="flex-1 h-14 rounded-2xl border border-white/5 bg-[#19172D] hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2 text-white font-bold text-sm shadow-xl group"
      >
        <MaterialIcon
          name="check_circle"
          className="text-green-500 group-hover:text-white transition-colors"
        />
        Terima
      </button>
    </div>
  );
}
