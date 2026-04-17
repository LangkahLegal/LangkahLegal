"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order") || "";
  const idPengajuan = searchParams.get("id") || "";

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
        <PageHeader title="Pembayaran Berhasil" backHref="/dashboard/client" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-lg mx-auto w-full py-12 space-y-8">
            {/* Success Animation */}
            <div className="text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center">
                  <MaterialIcon
                    name="check_circle"
                    className="text-emerald-400 text-5xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Pembayaran Berhasil!
                </h2>
                <p className="text-[#aca8c1] text-sm max-w-sm mx-auto leading-relaxed">
                  Konsultasi Anda telah terjadwal. Konsultan akan menghubungi
                  Anda sesuai waktu yang ditentukan.
                </p>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-[#1a1730] rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
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
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                    Berhasil
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-[#6f59fe]/5 rounded-2xl border border-[#6f59fe]/15 p-6 space-y-4">
              <p className="text-xs font-bold text-[#ada3ff] uppercase tracking-widest">
                Langkah Selanjutnya
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: "notifications_active",
                    text: "Tunggu notifikasi dari konsultan",
                  },
                  {
                    icon: "video_call",
                    text: "Siapkan materi dan dokumen konsultasi",
                  },
                  {
                    icon: "event_available",
                    text: "Hadir tepat waktu sesuai jadwal",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#6f59fe]/15 flex items-center justify-center shrink-0">
                      <MaterialIcon
                        name={step.icon}
                        className="text-[#ada3ff] text-sm"
                      />
                    </div>
                    <p className="text-sm text-white/80">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button
                fullWidth
                onClick={() => router.push("/dashboard/client")}
                className="py-5 rounded-xl"
              >
                <div className="flex items-center gap-2 justify-center">
                  <MaterialIcon name="dashboard" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Kembali ke Dashboard
                  </span>
                </div>
              </Button>

              {idPengajuan && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() =>
                    router.push(`/konsultasi`)
                  }
                  className="py-4 rounded-xl"
                >
                  <span className="text-sm">Lihat Konsultasi Saya</span>
                </Button>
              )}
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
