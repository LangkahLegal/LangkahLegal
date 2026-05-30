import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

export default function RatingModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ulasan, setUlasan] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-scale-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MaterialIcon name="star_rate" className="text-3xl text-primary" />
          </div>
          <h2 className="text-xl font-bold text-main mb-2">Sesi Selesai</h2>
          <p className="text-sm text-muted">
            Bagaimana pengalaman Anda berkonsultasi? Berikan rating dan ulasan untuk membantu konsultan menjadi lebih baik.
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <MaterialIcon
                name={star <= (hoverRating || rating) ? "star" : "star_border"}
                className={`text-4xl ${
                  star <= (hoverRating || rating)
                    ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    : "text-muted/30"
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* Ulasan */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-main uppercase tracking-wider mb-2">
            Ulasan Anda (Opsional)
          </label>
          <textarea
            value={ulasan}
            onChange={(e) => setUlasan(e.target.value)}
            placeholder="Bagikan pengalaman konsultasi Anda di sini..."
            className="w-full h-32 bg-input border border-surface rounded-xl p-4 text-sm text-main focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none placeholder:text-muted/50"
            maxLength={500}
          ></textarea>
          <div className="text-right mt-1 text-xs text-muted">
            {ulasan.length}/500
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl border border-surface text-main font-bold hover:bg-surface transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onSubmit(rating, ulasan)}
            disabled={rating === 0 || isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              "Kirim Ulasan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
