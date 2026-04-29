export default function CallbackError({ error, onRetry }) {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20">
        <span className="text-3xl">⚠️</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#e8e2fc]">Terjadi Kesalahan</h1>
        <div className="p-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          {error}
        </div>
      </div>

      <button
        onClick={onRetry}
        className="text-[#ada3ff] font-semibold hover:text-white transition-colors"
      >
        Kembali ke Login
      </button>
    </div>
  );
}
