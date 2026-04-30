"use client";
import { Button } from "@/components/ui";

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
      <div className="bg-[#1f1d35] w-full max-w-md rounded-2xl p-6 space-y-4 border border-white/10">

        <h3 className="text-white font-bold text-lg">
          {isReject ? "Tolak Konsultan?" : "Verifikasi Konsultan?"}
        </h3>

        <p className="text-sm text-[#aca8c1]">
          Yakin ingin{" "}
          <b>{isReject ? "menolak" : "memverifikasi"}</b>{" "}
          <span className="text-white font-semibold">
            {selectedItem?.nama_lengkap}
          </span>?
        </p>

        {/* ONLY SHOW IF REJECT */}
        {isReject && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Masukkan alasan penolakan..."
            className="w-full bg-[#0e0c1e] border border-white/10 rounded-xl p-3 text-sm text-white"
          />
        )}

        <div className="flex gap-3">
          <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 !py-2 !rounded-lg"
            >
              Batal
            </Button>

            <Button
              onClick={onConfirm}
              disabled={isLoading || (isReject && !reason.trim())}
              variant={isReject ? "danger" : "primary"}
              className="flex-1 !py-2 !rounded-lg font-bold"
            >
              {isLoading ? "Loading..." : "Ya, lanjutkan"}
            </Button>
            </div>
      </div>
    </div>
  );
}
