export default function CaseDescription({ description }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2">
        Deskripsi Kasus
      </h3>
      <div className="bg-card p-6 rounded-[2rem] border border-surface transition-colors duration-500">
        <p className="text-sm text-muted leading-relaxed">{description || "Tidak ada deskripsi kasus."}</p>
      </div>
    </section>
  );
}
