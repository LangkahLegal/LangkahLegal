"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button"; // Menggunakan komponen Button baru

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
  const [isPaid, setIsPaid] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark-tech");

  // --- 1. CONFIG & THEME DETECTION ---
  useEffect(() => {
    const detectTheme = () => {
      const htmlClasses = document.documentElement.classList;
      if (htmlClasses.contains("theme-white-modern"))
        return "theme-white-modern";
      return "dark-tech";
    };
    setCurrentTheme(detectTheme());
  }, []);

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const midtransScriptUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

  // --- 2. DATA FETCHING ---
  const {
    data: consultation,
    isLoading: isLoadingDetail,
    isError,
  } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
  });

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
          onSuccess: async () => {
            await paymentService.syncPaymentStatus(parseInt(id));
            setIsPaid(true);
          },
          onPending: () => {
            alert("Pembayaran tertunda. Silakan selesaikan di aplikasi Anda.");
            router.push("/dashboard/client");
          },
          onError: () => alert("Pembayaran gagal. Silakan coba lagi."),
        });
      }
    },
    onError: (err) => {
      alert(err.response?.data?.detail || "Gagal memulai transaksi");
    },
  });

  // --- 4. DERIVED STATE ---
  const konsultan = consultation?.jadwal_ketersediaan?.konsultan || {};
  const isSettled = paymentStatus?.status_pembayaran === "settlement";

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
  if (isError || !consultation) return <ErrorState />;

  return (
    <div className="bg-bg text-main min-h-screen flex w-full overflow-x-hidden font-primary transition-colors duration-500">
      <Script
        src={midtransScriptUrl}
        data-client-key={midtransClientKey}
        strategy="afterInteractive"
      />

      <Sidebar role="client" />

      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Selesaikan Pembayaran" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-xl mx-auto w-full space-y-8 animate-fade-in">
            <ClientCard
              name={konsultan.nama_lengkap || "Konsultan"}
              createdAt={consultation?.created_at}
              avatar={konsultan.foto_profil}
            />

            <InfoGrid
              date={consultation?.tanggal_konsultasi}
              time={consultation?.rentang_waktu}
            />

            <PaymentBreakdown
              pricePerSession={konsultan.tarif_per_sesi || 0}
              quantity={consultation?.jumlah_sesi || 1}
              totalAmount={
                consultation?.total_harga || konsultan.tarif_per_sesi || 0
              }
              sessionDuration={30}
            />

            <div className="pt-4 space-y-4">
              {/* IMPLEMENTASI KOMPONEN BUTTON BARU */}
              <Button
                variant="primary"
                fullWidth
                isLoading={transactionMutation.isPending}
                onClick={() => transactionMutation.mutate()}
                className="py-6 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <MaterialIcon name="account_balance_wallet" />
                  <span className="uppercase tracking-widest text-sm">
                    Bayar Sekarang
                  </span>
                </div>
              </Button>

              <p className="text-[10px] text-muted text-center italic">
                * Anda akan diarahkan ke layanan pembayaran aman Midtrans.
              </p>
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

// --- SUB-KOMPONEN STATUS (Theme Aware & Menggunakan Button Baru) ---

const LoadingState = () => (
  <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-primary-light text-xs font-bold tracking-widest uppercase animate-pulse">
        Menyiapkan Transaksi...
      </p>
    </div>
  </div>
);

const ErrorState = () => (
  <div className="bg-bg min-h-screen flex items-center justify-center text-main p-6 text-center transition-colors duration-500">
    <div className="flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center text-danger">
        <MaterialIcon name="error_outline" className="text-4xl" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">Gagal Memuat Pembayaran</h3>
        <p className="text-muted text-sm max-w-xs mx-auto mb-8">
          Terjadi kesalahan saat mengambil rincian tagihan Anda. Silakan coba
          kembali.
        </p>
        <Button
          variant="secondary"
          onClick={() => window.location.reload()}
          className="rounded-full px-10"
        >
          Coba Lagi
        </Button>
      </div>
    </div>
  </div>
);
