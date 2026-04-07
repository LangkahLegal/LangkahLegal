export default function LinkedInField({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block font-['Inter',sans-serif] text-[10px] font-bold text-[#aca8c1] px-1 uppercase tracking-[0.15em]">
        Link LinkedIn
      </label>
      <div className="relative flex items-center">
        {/* LinkedIn Icon */}
        <div className="absolute left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-[#ada3ff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://linkedin.com/in/username"
          className="w-full bg-white/5 backdrop-blur-md text-[#e8e2fc] border border-[#6D57FC]/20 rounded-xl pl-12 pr-4 py-3.5 font-['Inter',sans-serif] outline-none transition-all focus:ring-1 focus:ring-[#6D57FC] focus:border-[#6D57FC]/50 focus:shadow-[0_0_15px_rgba(109,87,252,0.3)] placeholder:text-[#aca8c1]/40
          "
        />
      </div>
    </div>
  );
}