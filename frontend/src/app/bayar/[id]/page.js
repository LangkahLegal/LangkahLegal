"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Script from "next/script";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import SuccessView from "@/components/layout/SuccessView";

// Components
import PaymentBreakdown from "@/components/payment/PaymentBreakdown";

// Services
import { consultationService } from "@/services/consultation.service";

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isPaid, setIsPaid] = useState(false);

  // --- 1. FETCH DATA DETAIL ---
  const {
    data: requestData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
    select: (data) => ({
      id_pengajuan: data.id_pengajuan,
      // Karena Client yang melihat, maka yang ditampilkan adalah nama Konsultan
      consultantName: data.konsultan?.nama_lengkap || "Konsultan",
      consultantAvatar: data.konsultan?.foto_profil,
      createdAt: data.created_at,
      consultationDate: data.tanggal_konsultasi,
      consultationTime: data.rentang_waktu,
      tarif: data.konsultan?.tarif_per_sesi || data.jadwal_ketersediaan?.konsultan?.tarif_per_sesi || 0,
      jumlah_sesi: data.jumlah_sesi || 1,
      total_harga: data.total_harga || 0,
      status: data.status_pengajuan,
    }),
  });

  // --- 2. MUTATION: CREATE TRANSACTION (MIDTRANS) ---
  const paymentMutation = useMutation({
    mutationFn: () =>
      consultationService.createTransaction({ id_pengajuan: parseInt(id) }),
    onSuccess: (res) => {
      // res berisi snap_token dari backend
      if (window.snap) {
        window.snap.pay(res.snap_token, {
          onSuccess: (result) => {
            setIsPaid(true);
          },
          onPending: (result) => {
            alert("Pembayaran tertunda, silakan selesaikan transaksi Anda.");
            router.push("/dashboard/client");
          },
          onError: (result) => {
            alert("Pembayaran gagal, silakan coba lagi.");
          },
          onClose: () => {
            console.log(
              "Customer closed the popup without finishing the payment",
            );
          },
        });
      }
    },
    onError: (err) => {
      alert(err.response?.data?.detail || "Gagal memulai proses pembayaran");
    },
  });

  // --- 3. LOGIKA RENDER ---

  if (isPaid) {
    return (
      <SuccessView
        title="Pembayaran Berhasil!"
        description="Terima kasih! Pembayaran Anda telah kami terima. Link konsultasi (Zoom) akan muncul di halaman detail setelah status diperbarui."
        onAction={() => router.push("/dashboard/client")}
      />
    );
  }

  if (isLoading) return <LoadingSpinner />;

  if (isError || !requestData) return <ErrorState />;

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      {/* Script Midtrans Snap (Pastikan Client Key sudah benar di backend) */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      <Sidebar role="client" />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Pembayaran Konsultasi" />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8">
            {/* Informasi Konsultan yang akan dibayar */}
            <ClientCard
              name={requestData.consultantName}
              createdAt={requestData.createdAt}
              avatar={requestData.consultantAvatar}
            />

            {/* Jadwal Konsultasi */}
            <InfoGrid
              date={requestData.consultationDate}
              time={requestData.consultationTime}
            />

            {/* Rincian Biaya (Komponen Baru) */}
            <PaymentBreakdown
              pricePerSession={requestData.tarif}
              quantity={requestData.jumlah_sesi}
              totalAmount={requestData.total_harga || requestData.tarif}
              sessionDuration={30}
            />

            {/* Tombol Aksi */}
            <div className="pt-4">
              <Button
                fullWidth
                size="lg"
                onClick={() => paymentMutation.mutate()}
                isLoading={paymentMutation.isPending}
                className="py-6 rounded-[1.5rem] shadow-[0_15px_30px_rgba(111,89,254,0.2)]"
              >
                <div className="flex items-center gap-3">
                  <MaterialIcon name="account_balance_wallet" />
                  <span className="font-bold uppercase tracking-widest text-sm">
                    Bayar Sekarang
                  </span>
                </div>
              </Button>
              <p className="text-[10px] text-[#aca8c1] text-center mt-4 italic">
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

// --- SUB-KOMPONEN STATUS ---

const LoadingSpinner = () => (
  <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#6f59fe] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#ada3ff] text-[10px] font-bold tracking-widest uppercase animate-pulse">
        Menyiapkan Tagihan...
      </p>
    </div>
  </div>
);

const ErrorState = () => (
  <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-white p-6 text-center">
    <div>
      <p className="text-rose-400 font-bold mb-4">
        Gagal memuat data pembayaran.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs bg-white/10 px-4 py-2 rounded-lg"
      >
        Coba Lagi
      </button>
    </div>
  </div>
);
