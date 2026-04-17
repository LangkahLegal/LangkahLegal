"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";
import { paymentService } from "@/services/payment.service";
import { consultationService } from "@/services/consultation.service";

export default function PaymentPage() {
  const { id } = useParams(); // id = id_pengajuan
  const router = useRouter();

  const [consultation, setConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const midtransClientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const midtransScriptUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

  // Fetch consultation detail & existing payment status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [detail, statusRes] = await Promise.all([
          consultationService.getConsultationDetail(id),
          paymentService.getPaymentStatus(id).catch(() => ({ data: null })),
        ]);
        setConsultation(detail);
        if (statusRes.data) {
          setPaymentStatus(statusRes.data);
        }
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setError("Gagal memuat data pengajuan");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Handle payment initiation
  const handlePay = useCallback(async () => {
    if (!snapReady) {
      setError("Midtrans belum siap. Mohon tunggu sebentar...");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // 1. Request snap token from backend
      const result = await paymentService.createTransaction(parseInt(id));

      if (!result.snap_token) {
        throw new Error("Tidak mendapatkan token pembayaran");
      }

      // 2. Open Snap popup
      window.snap.pay(result.snap_token, {
        onSuccess: async function (result) {
          console.log("Payment success:", result);
          // Sync status ke DB (fallback jika webhook belum sampai)
          try {
            await paymentService.syncPaymentStatus(parseInt(id));
          } catch (syncErr) {
            console.warn("Sync after success failed (webhook might handle it):", syncErr);
          }
          router.push(`/payment/success?order=${result.order_id}&id=${id}`);
        },
        onPending: async function (result) {
          console.log("Payment pending:", result);
          // Sync status ke DB
          try {
            await paymentService.syncPaymentStatus(parseInt(id));
          } catch (syncErr) {
            console.warn("Sync after pending failed:", syncErr);
          }
          router.push(`/payment/pending?order=${result.order_id}&id=${id}`);
        },
        onError: function (result) {
          console.error("Payment error:", result);
          setError("Pembayaran gagal. Silakan coba lagi.");
          setIsProcessing(false);
        },
        onClose: function () {
          console.log("Payment popup closed");
          setIsProcessing(false);
        },
      });
    } catch (err) {
      console.error("Gagal memulai pembayaran:", err);
      setError(
        err.response?.data?.detail || "Gagal memulai pembayaran. Silakan coba lagi."
      );
      setIsProcessing(false);
    }
  }, [snapReady, id, router]);

  // Format currency
  const formatRupiah = (num) => {
    if (!num) return "Rp 0";
    return `Rp ${parseInt(num).toLocaleString("id-ID")}`;
  };

  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]"></div>
          <p className="text-[#ada3ff] animate-pulse">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  // If payment already settled
  if (paymentStatus?.status_pembayaran === "settlement") {
    return (
      <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
        <Sidebar role="client" />
        <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
          <PageHeader title="Pembayaran" backHref="/konsultasi" />
          <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
            <div className="max-w-lg mx-auto text-center py-20 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <MaterialIcon name="check_circle" className="text-emerald-400 text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-white">Pembayaran Berhasil</h2>
              <p className="text-[#aca8c1]">
                Pembayaran untuk konsultasi ini sudah dikonfirmasi.
              </p>
              <Button onClick={() => router.push("/dashboard/client")} fullWidth>
                Kembali ke Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Get consultant info from consultation data
  const konsultan = consultation?.jadwal_ketersediaan?.konsultan || {};
  const jadwal = consultation?.jadwal_ketersediaan || {};
  const jamMulai = String(consultation?.jam_mulai || "").substring(0, 5);
  const jamSelesai = String(consultation?.jam_selesai || "").substring(0, 5);

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      {/* Midtrans Snap.js Script */}
      <Script
        src={midtransScriptUrl}
        data-client-key={midtransClientKey}
        strategy="afterInteractive"
        onReady={() => {
          console.log("[Snap.js] Ready");
          setSnapReady(true);
        }}
        onError={() => {
          console.error("[Snap.js] Failed to load");
          setError("Gagal memuat Midtrans. Coba refresh halaman.");
        }}
      />

      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
        <PageHeader title="Pembayaran" backHref="/konsultasi" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-lg mx-auto w-full space-y-8">
            {/* Payment Status Header */}
            <div className="text-center space-y-2 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#6f59fe]/20 border border-[#6f59fe]/30 flex items-center justify-center mb-4">
                <MaterialIcon name="payments" className="text-[#ada3ff] text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-white">Selesaikan Pembayaran</h2>
              <p className="text-sm text-[#aca8c1]">
                Lakukan pembayaran untuk mengkonfirmasi jadwal konsultasi Anda
              </p>
            </div>

            {/* Consultation Summary Card */}
            <div className="bg-[#1a1730] rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <p className="text-xs font-bold text-[#ada3ff] uppercase tracking-widest">
                  Ringkasan Konsultasi
                </p>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Consultant */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6f59fe]/20 flex items-center justify-center shrink-0">
                    <MaterialIcon name="person" className="text-[#ada3ff] text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-[#aca8c1]">Konsultan</p>
                    <p className="text-sm font-semibold text-white">
                      {konsultan.nama_lengkap || "—"}
                    </p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6f59fe]/20 flex items-center justify-center shrink-0">
                    <MaterialIcon name="calendar_month" className="text-[#ada3ff] text-lg" />
                  </div>
                  <div>
                    <p className="text-xs text-[#aca8c1]">Jadwal</p>
                    <p className="text-sm font-semibold text-white">
                      {jadwal.tanggal || "—"} • {jamMulai} - {jamSelesai}
                    </p>
                  </div>
                </div>

                {/* Case Description */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6f59fe]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MaterialIcon name="description" className="text-[#ada3ff] text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#aca8c1]">Deskripsi Kasus</p>
                    <p className="text-sm text-white/80 line-clamp-2">
                      {consultation?.deskripsi_kasus || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-gradient-to-br from-[#6f59fe]/10 to-[#ada3ff]/5 rounded-2xl border border-[#6f59fe]/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#aca8c1] uppercase tracking-widest font-bold">
                    Total Pembayaran
                  </p>
                  <p className="text-3xl font-extrabold text-white mt-1">
                    {formatRupiah(
                      paymentStatus?.gross_amount ||
                        consultation?.jadwal_ketersediaan?.konsultan?.tarif_per_sesi ||
                        0
                    )}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#6f59fe]/20 flex items-center justify-center">
                  <MaterialIcon name="account_balance_wallet" className="text-[#ada3ff] text-2xl" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <MaterialIcon name="schedule" className="text-amber-400 text-sm" />
                <p className="text-xs text-amber-400/80">
                  Batas pembayaran: 1 jam setelah memulai
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <MaterialIcon name="error" className="text-rose-400 text-xl shrink-0 mt-0.5" />
                <p className="text-sm text-rose-300">{error}</p>
              </div>
            )}

            {/* Pay Button */}
            <div className="pt-2 space-y-3">
              <Button
                fullWidth
                isLoading={isProcessing}
                onClick={handlePay}
                className="py-5 rounded-xl shadow-[0_10px_30px_rgba(111,89,254,0.3)] bg-gradient-to-r from-[#6f59fe] to-[#8b7aff] hover:from-[#7f6bff] hover:to-[#9d8fff] border-0"
              >
                <div className="flex items-center gap-2 justify-center">
                  <MaterialIcon name="lock" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Bayar Sekarang
                  </span>
                </div>
              </Button>

              <p className="text-center text-[10px] text-[#aca8c1]">
                Pembayaran diproses secara aman oleh Midtrans
              </p>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-[#1a1730]/50 rounded-xl border border-white/5 p-5">
              <p className="text-xs font-bold text-[#aca8c1] uppercase tracking-widest mb-3">
                Metode Pembayaran
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "credit_card", label: "Kartu Kredit/Debit" },
                  { icon: "account_balance", label: "Transfer Bank" },
                  { icon: "qr_code_2", label: "QRIS" },
                  { icon: "wallet", label: "E-Wallet" },
                ].map((method) => (
                  <div
                    key={method.label}
                    className="flex items-center gap-2 text-[#aca8c1] text-xs bg-white/[0.03] rounded-lg px-3 py-2.5"
                  >
                    <MaterialIcon name={method.icon} className="text-sm text-[#ada3ff]/60" />
                    <span>{method.label}</span>
                  </div>
                ))}
              </div>
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
