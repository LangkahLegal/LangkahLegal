export default function CreatePasswordHeader() {
  return (
    <header className="mb-8 text-center space-y-3">
      {/* Lock icon */}
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span
          className="material-symbols-outlined text-primary text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lock
        </span>
      </div>

      <h1 className="font-headline text-[2rem] md:text-4xl font-extrabold tracking-tighter text-main leading-tight">
        Buat Password
      </h1>
      <p className="text-muted text-[0.9375rem] font-medium px-4 leading-relaxed">
        Buat password untuk akun Anda agar bisa login tanpa Google di kemudian
        hari.
      </p>
    </header>
  );
}
