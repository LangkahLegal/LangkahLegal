"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";
import { paymentService } from "@/services/payment.service";

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order") || "";
  const idPengajuan = searchParams.get("id") || "";

  const [status, setStatus] = useState("pending");
  const [polling, setPolling] = useState(true);

  // Poll payment status every 5 seconds — also syncs from Midtrans
  useEffect(() => {
    if (!idPengajuan || !polling) return;

    const interval = setInterval(async () => {
      try {
        // 1. Sync dari Midtrans ke DB (fallback jika webhook belum sampai)
        try {
          await paymentService.syncPaymentStatus(parseInt(idPengajuan));
        } catch (syncErr) {
          // Abaikan error sync, tetap cek status lokal
          console.warn("Sync error:", syncErr);
        }

        // 2. Cek status terbaru dari DB
        const res = await paymentService.getPaymentStatus(idPengajuan);
        const currentStatus = res.data?.status_pembayaran;

        if (currentStatus === "settlement") {
          setStatus("settlement");
          setPolling(false);
          // Auto-redirect after showing success briefly
          setTimeout(() => {
            router.push(
              `/payment/success?order=${orderId}&id=${idPengajuan}`
            );
          }, 2000);
        } else if (["cancel", "expire", "deny"].includes(currentStatus)) {
          setStatus(currentStatus);
          setPolling(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [idPengajuan, polling, orderId, router]);

  const getStatusConfig = () => {
    switch (status) {
      case "settlement":
        return {
          icon: "check_circle",
          color: "emerald",
          title: "Pembayaran Berhasil!",
          subtitle: "Mengalihkan ke halaman konfirmasi...",
        };
      case "cancel":
      case "expire":
      case "deny":
        return {
          icon: "cancel",
          color: "rose",
          title: "Pembayaran Gagal",
          subtitle:
            status === "expire"
              ? "Waktu pembayaran telah habis."
              : "Pembayaran dibatalkan atau ditolak.",
        };
      default:
        return {
          icon: "hourglass_top",
          color: "amber",
          title: "Menunggu Pembayaran",
          subtitle:
            "Silakan selesaikan pembayaran Anda. Halaman ini akan otomatis diperbarui.",
        };
    }
  };

  const config = getStatusConfig();
  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-400/40",
      text: "text-emerald-400",
      ping: "bg-emerald-500/20",
    },
    amber: {
      bg: "bg-amber-500/20",
      border: "border-amber-400/40",
      text: "text-amber-400",
      ping: "bg-amber-500/20",
    },
    rose: {
      bg: "bg-rose-500/20",
      border: "border-rose-400/40",
      text: "text-rose-400",
      ping: "bg-rose-500/20",
    },
  };
  const colors = colorMap[config.color];

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
        <PageHeader title="Status Pembayaran" backHref="/dashboard/client" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-lg mx-auto w-full py-12 space-y-8">
            {/* Status Animation */}
            <div className="text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                {polling && (
                  <div
                    className={`absolute inset-0 rounded-full ${colors.ping} animate-ping`}
                  />
                )}
                <div
                  className={`relative w-24 h-24 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}
                >
                  <MaterialIcon
                    name={config.icon}
                    className={`${colors.text} text-5xl ${polling ? "animate-pulse" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">{config.title}</h2>
                <p className="text-[#aca8c1] text-sm max-w-sm mx-auto leading-relaxed">
                  {config.subtitle}
                </p>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-[#1a1730] rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <p
                  className={`text-xs font-bold ${colors.text} uppercase tracking-widest`}
                >
                  Detail Transaksi
                </p>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#aca8c1]">Order ID</span>
                  <span className="text-sm font-mono text-white/90">
                    {orderId || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#aca8c1]">Status</span>
                  <span
                    className={`text-xs font-bold ${colors.text} ${colors.bg} px-3 py-1 rounded-full`}
                  >
                    {status === "pending"
                      ? "Menunggu"
                      : status === "settlement"
                        ? "Berhasil"
                        : "Gagal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Polling indicator */}
            {polling && (
              <div className="flex items-center justify-center gap-3 py-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-xs text-[#aca8c1]">
                  Memeriksa status pembayaran secara otomatis...
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-4">
              {(status === "cancel" ||
                status === "expire" ||
                status === "deny") && (
                <Button
                  fullWidth
                  onClick={() => router.push(`/payment/${idPengajuan}`)}
                  className="py-5 rounded-xl shadow-[0_10px_30px_rgba(111,89,254,0.3)] bg-gradient-to-r from-[#6f59fe] to-[#8b7aff] border-0"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <MaterialIcon name="refresh" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Coba Bayar Lagi
                    </span>
                  </div>
                </Button>
              )}

              <Button
                variant="secondary"
                fullWidth
                onClick={() => router.push("/dashboard/client")}
                className="py-4 rounded-xl"
              >
                <span className="text-sm">Kembali ke Dashboard</span>
              </Button>
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]" />
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
