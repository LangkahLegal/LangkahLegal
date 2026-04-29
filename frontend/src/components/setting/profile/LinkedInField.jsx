export default function LinkedInField({ value, onChange, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="block font-headline text-[11px] font-bold uppercase tracking-[0.12em] text-muted ml-1">
        Link LinkedIn
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-primary-light"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </div>
        <input
          type="url"
          value={value}
          onChange={onChange}
          placeholder="https://linkedin.com/in/username"
          className="w-full font-headline text-sm bg-dark/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-main transition-all duration-200 outline-none focus:border-primary-light focus:bg-[#1f1d35] focus:ring-1 focus:ring-primary-light/20 placeholder:text-muted/30"
        />
      </div>
    </div>
  );
}
