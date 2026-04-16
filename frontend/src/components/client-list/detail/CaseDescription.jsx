export default function CaseDescription({ description, note }) {
  return (
    <div className="bg-[#1f1d35] rounded-[2rem] p-6 space-y-4 border border-white/5 shadow-lg">
      <div className="flex items-center gap-2 border-l-4 border-[#ada3ff] pl-3">
        <h3 className="font-bold text-lg text-white">Deskripsi Kasus</h3>
      </div>
      
      <p className="text-[#aca8c1] text-sm leading-relaxed whitespace-pre-wrap">
        {description || "Tidak ada deskripsi kasus yang diberikan."}
      </p>

      {/* Tampilkan catatan hanya jika ada datanya */}
      {note && (
        <div className="bg-[#2c2945]/50 p-4 rounded-2xl border border-white/5 italic text-[#ada3ff] text-sm">
          &quot;{note}&quot;
        </div>
      )}
    </div>
  );
}