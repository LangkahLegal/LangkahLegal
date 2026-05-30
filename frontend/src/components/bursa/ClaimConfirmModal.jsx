import { motion } from "framer-motion";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function ClaimConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-6"
      onClick={onClose}
      data-testid="bursa-claim-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-card border border-surface rounded-3xl p-8 max-w-sm w-full space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MaterialIcon
            name="front_hand"
            className="text-primary-light text-3xl"
          />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold font-headline">Konfirmasi Klaim</h3>
          <p className="text-muted text-sm leading-relaxed">
            Setelah diklaim, kasus ini akan menjadi tanggung jawab Anda dan sesi
            konsultasi akan otomatis dibuat.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="!rounded-xl"
            data-testid="bursa-claim-cancel-btn"
          >
            Batal
          </Button>
          <Button
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
            className="!rounded-xl"
            data-testid="bursa-claim-confirm-btn"
          >
            Ya, Klaim
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
