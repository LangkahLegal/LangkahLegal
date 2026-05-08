"use client";
import { Button } from "@/components/ui/Button";

export default function ConfirmActionModal({
  open,
  actionType,
  selectedItem,
  reason,
  setReason,
  onClose,
  onConfirm,
  isLoading,
}) {
  if (!open) return null;

  const isReject = actionType === "ditolak";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 space-y-4 border border-surface">

        <h3 className="text-main font-bold text-lg">
          {isReject ? "Tolak Konsultan?" : "Verifikasi Konsultan?"}
        </h3>

        <p className="text-sm text-muted">
          Yakin ingin{" "}
          <b>{isReject ? "menolak" : "memverifikasi"}</b>{" "}
          <span className="text-main font-semibold">
            {selectedItem?.nama_lengkap}
          </span>?
        </p>

        {/* ONLY SHOW IF REJECT */}
        {isReject && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Masukkan alasan penolakan agar konsultan mengetahuinya..."
            className="w-full bg-input border border-surface rounded-xl p-3 text-sm text-main"
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Batal
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isLoading || (isReject && !reason.trim())}
            isLoading={isLoading}
            variant={isReject ? "danger" : "primary"}
            className={`flex-1 font-bold ${
              isReject ? "!bg-danger !text-white !border-danger hover:!brightness-110" : ""
            }`}
          >
            {isReject ? "Ya, Tolak" : "Ya, Verifikasi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
