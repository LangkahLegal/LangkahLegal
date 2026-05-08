export default function CallbackLoading() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#e8e2fc] tracking-tight">
          Memproses login...
        </h1>
        <p className="text-[#aca8c1] text-sm leading-relaxed">
          Mohon tunggu sebentar, kami sedang menyiapkan dashboard Anda.
        </p>
      </div>
    </div>
  );
}
