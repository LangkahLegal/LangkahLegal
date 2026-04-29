export default function CaseDescription({ description }) {
  return (
    /* REFACTOR: bg-[#1f1d35] -> bg-card | border-white/5 -> border-surface */
    <section className="bg-card p-6 rounded-[32px] border border-surface space-y-4 transition-colors duration-500">
      <div className="flex items-center gap-3">
        {/* REFACTOR: bg-[#6f59fe] -> bg-primary */}
        <div className="w-1 h-6 bg-primary rounded-full shadow-soft" />
        {/* REFACTOR: text-white -> text-main */}
        <h3 className="text-lg font-bold text-main">Deskripsi Kasus</h3>
      </div>
      {/* REFACTOR: text-[#aca8c1] -> text-muted */}
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </section>
  );
}
