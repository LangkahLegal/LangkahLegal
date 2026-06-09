export default function AboutSection({ bio, tags }) {
  // --- Safety Check: Mencegah error jika tags undefined ---
  const safeTags = tags || [];
  const safeBio = bio || "Informasi belum tersedia.";

  return (
    <section className="space-y-4 w-full">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
        <h2 className="text-base sm:text-lg font-bold text-main uppercase tracking-tight transition-colors duration-500">
          Tentang
        </h2>
      </div>

      <div className="bg-card/30 border border-surface rounded-[1.5rem] sm:rounded-[2rem] p-6 space-y-6 transition-colors duration-500">
        <p className="text-sm leading-relaxed text-muted">{safeBio}</p>

        <div className="flex flex-wrap gap-2">
          {safeTags.map((tag, index) => (
            <span
              key={tag || index}
              className="px-4 py-2 bg-card border border-surface rounded-xl text-[10px] sm:text-[11px] font-bold text-primary-light uppercase tracking-wider transition-all duration-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
