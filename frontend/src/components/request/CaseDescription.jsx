export default function CaseDescription({ description }) {
  return (
    <section className="bg-[#1f1d35] p-6 rounded-[32px] border border-white/5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-[#6f59fe] rounded-full" />
        <h3 className="text-lg font-bold text-white">Deskripsi Kasus</h3>
      </div>
      <p className="text-sm text-[#aca8c1] leading-relaxed">{description}</p>
    </section>
  );
}
