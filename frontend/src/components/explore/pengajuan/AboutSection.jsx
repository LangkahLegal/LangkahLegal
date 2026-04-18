export default function AboutSection({ bio, tags }) {
  return (
    <section className="space-y-4 w-full">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
        <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
          Tentang
        </h2>
      </div>
      <div className="bg-[#1f1d35]/30 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-6 space-y-6">
        <p className="text-sm leading-relaxed text-[#aca8c1]">{bio}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 bg-[#1f1d35] border border-white/5 rounded-xl text-[10px] sm:text-[11px] font-bold text-[#ada3ff] uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
