"use client";

import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

/**
 * Tombol "Bayar Sekarang" yang bisa dipakai di halaman manapun.
 * Akan redirect ke halaman payment untuk membuka popup Midtrans Snap.
 *
 * @param {Object} props
 * @param {number} props.idPengajuan - ID pengajuan konsultasi
 * @param {string} [props.status] - Status pengajuan saat ini
 * @param {string} [props.className] - Additional CSS classes
 */
export default function PaymentButton({
  idPengajuan,
  status,
  className = "",
}) {
  const router = useRouter();

  // Hanya tampilkan jika status memerlukan pembayaran (sesuai backend PAYABLE_STATUSES)
  const payableStatuses = [
    "menunggu_pembayaran",
    "pembayaran_gagal",
    "kedaluwarsa",
    "dibatalkan",
  ];

  if (!payableStatuses.includes(status)) {
    return null;
  }

  const isRetry = status !== "menunggu_pembayaran";

  return (
    <Button
      fullWidth
      onClick={() => router.push(`/payment/${idPengajuan}`)}
      className={`py-4 rounded-xl shadow-[0_10px_30px_rgba(111,89,254,0.3)] bg-gradient-to-r from-[#6f59fe] to-[#8b7aff] hover:from-[#7f6bff] hover:to-[#9d8fff] border-0 ${className}`}
    >
      <div className="flex items-center gap-2 justify-center">
        <MaterialIcon name={isRetry ? "refresh" : "payments"} />
        <span className="text-sm font-bold uppercase tracking-wider">
          {isRetry ? "Coba Bayar Lagi" : "Bayar Sekarang"}
        </span>
      </div>
    </Button>
  );
}
