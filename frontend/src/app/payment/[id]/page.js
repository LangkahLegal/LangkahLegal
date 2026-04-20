"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

// Komponen Pendukung
import SuccessView from "@/components/layout/SuccessView";
import PaymentBreakdown from "@/components/payment/PaymentBreakdown";
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";

// Services
import { paymentService } from "@/services/payment.service";
import { consultationService } from "@/services/consultation.service";

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPaid, setIsPaid] = useState(false);

  // --- 1. CONFIG MIDTRANS ---
  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const midtransScriptUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

  // --- 2. DATA FETCHING ---
  // Detail Pengajuan Konsultasi
  const { data: consultation, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
  });

  // Status Transaksi
  const { data: paymentStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["paymentStatus", id],
    queryFn: () => paymentService.getPaymentStatus(id),
    enabled: !!id,
    refetchInterval: (data) =>
      data?.status_pembayaran === "pending" ? 5000 : false,
  });

  // --- 3. MUTATION: CREATE TRANSACTION ---
  const transactionMutation = useMutation({
    mutationFn: () => paymentService.createTransaction(parseInt(id)),
    onSuccess: (res) => {
      if (window.snap) {
        window.snap.pay(res.snap_token, {
          onSuccess: async (result) => {
            await paymentService.syncPaymentStatus(parseInt(id));
            setIsPaid(true);
          },
          onPending: () => {
            alert("Pembayaran tertunda. Silakan selesaikan di aplikasi Anda.");
            router.push("/dashboard/client");
          },
          onError: () => alert("Pembayaran gagal. Silakan coba lagi."),
          onClose: () => console.log("User closed payment popup"),
        });
      }
    },
    onError: (err) => {
      alert(err.response?.data?.detail || "Gagal memulai transaksi");
    },
  });

  // --- 4. DERIVED STATE & FORMATTING ---
  const konsultan = consultation?.jadwal_ketersediaan?.konsultan || {};
  const isSettled = paymentStatus?.status_pembayaran === "settlement";

  // Ambil jam mulai dan selesai dari root data pengajuan_konsultasi
  const startTime = consultation?.jam_mulai?.substring(0, 5) || "";
  const endTime = consultation?.jam_selesai?.substring(0, 5) || "";

  // --- 5. RENDER LOGIC ---

  if (isSettled || isPaid) {
    return (
      <SuccessView
        title="Pembayaran Berhasil!"
        description="Terima kasih! Pembayaran Anda telah kami terima. Jadwal konsultasi Anda kini telah terkonfirmasi secara resmi."
        onAction={() => router.push("/dashboard/client")}
      />
    );
  }

  if (isLoadingDetail || isLoadingStatus) return <LoadingState />;

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Script
        src={midtransScriptUrl}
        data-client-key={midtransClientKey}
        strategy="afterInteractive"
      />

      <Sidebar role="client" />

      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
        <PageHeader title="Selesaikan Pembayaran" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-xl mx-auto w-full space-y-8">
            {/* Kartu Informasi Konsultan */}
            <ClientCard
              name={konsultan.nama_lengkap || "Konsultan"}
              createdAt={consultation?.created_at}
              avatar={konsultan.foto_profil}
            />

            {/* Grid Informasi Tanggal & Slot */}
            <InfoGrid
              date={consultation?.tanggal_konsultasi}
              time={consultation?.rentang_waktu}
            />

            {/* Rincian Biaya dengan Jam Dinamis */}
            <PaymentBreakdown
              pricePerSession={konsultan.tarif_per_sesi || 0}
              quantity={consultation?.jumlah_sesi || 1}
              totalAmount={consultation?.total_harga || (konsultan.tarif_per_sesi || 0)}
              sessionDuration={30}
            />

            {/* Area Tombol Bayar */}
            <div className="pt-4 space-y-4">
              <Button
                fullWidth
                isLoading={transactionMutation.isPending}
                onClick={() => transactionMutation.mutate()}
                className="py-5 rounded-2xl bg-gradient-to-r from-[#6f59fe] to-[#8b7aff] shadow-[0_15px_30px_rgba(111,89,254,0.3)] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-widest">
                    Bayar Sekarang
                  </span>
                </div>
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

const LoadingState = () => (
  <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]"></div>
      <p className="text-[#ada3ff] text-xs font-bold tracking-widest uppercase animate-pulse">
        Menyiapkan Transaksi...
      </p>
    </div>
  </div>
);
