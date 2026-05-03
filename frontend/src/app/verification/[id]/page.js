"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

import PageHeader from "@/components/layout/PageHeader";
import VerificationHero from "@/components/verification/VerificationHero";
import PriceCard from "@/components/explore/pengajuan/PriceCard";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import AboutSection from "@/components/explore/pengajuan/AboutSection";
import InfoCard from "@/components/verification/InfoCard";
import ActionButtons from "@/components/request/ActionButtons";
import ConfirmActionModal from "@/components/verification/ConfirmActionModal";

import {
  getConsultantDetail,
  verifyConsultant,
} from "@/services/admin.service";

export default function VerificationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["consultantDetail", id],
    queryFn: () => getConsultantDetail(Number(id)),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: ({ action, reason }) =>
      verifyConsultant(Number(id), action, reason),
    onSuccess: () => {
      router.push("/verification");
    },
  });

  const consultant = data?.data;

  if (isLoading) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary-light text-[10px] font-bold uppercase animate-pulse">
            Memuat Data...
          </p>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center text-main transition-colors duration-500">
        Data Konsultan Tidak Ditemukan
      </div>
    );
  }

  const mapped = {
    id: consultant.id_konsultan,
    nama_lengkap: consultant.nama_lengkap,
    email: consultant.users?.email,
    spesialisasi: consultant.spesialisasi,
    kota: consultant.kota_praktik,
    pengalaman: consultant.pengalaman_tahun,
    tarif: consultant.tarif_per_sesi,
    status: consultant.status_verifikasi,
    foto:
      consultant.users?.foto_profil ||
      `https://ui-avatars.com/api/?name=${consultant.nama_lengkap}`,
    pendidikan: consultant.pendidikan_terakhir,
    gelar: consultant.gelar_akademik,
    izin: consultant.nomor_izin_praktik,
    bio: consultant.bio_singkat,
    deskripsi:
      consultant.deskripsi_lengkap && consultant.deskripsi_lengkap !== "-"
        ? consultant.deskripsi_lengkap
        : "Belum ada deskripsi",
    linkedin: consultant.linkedin,
    portofolio: consultant.portofolio,
    rating: consultant.rating || 0,
    reviews: consultant.total_reviews || 0,
    aktif: consultant.is_active,
  };

  return (
    <div className="bg-bg text-main min-h-screen flex overflow-hidden transition-colors duration-500">
      <Sidebar role="admin"/>

      <div className="flex-1 flex flex-col lg:ml-64">
        <PageHeader title="Detail Verifikasi" backHref="/verification" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10">

            {/* CONTENT */}
              <VerificationHero
                name={mapped.nama_lengkap}
                avatar={mapped.foto}
                rating={`${mapped.rating} (${mapped.reviews})`}
                linkedinUrl={mapped.linkedin}
                portofolioUrl={mapped.portofolio}
                status={mapped.status}
                isActive={mapped.aktif}
                bio={mapped.bio}
              />

              <PriceCard
                price={
                  mapped.tarif
                    ? mapped.tarif.toLocaleString("id-ID")
                    : "-"
                }
              />

              <InfoCard {...mapped} />

              <AboutSection
                bio={mapped.deskripsi}
                tags={mapped.spesialisasi?.split(",") || []}
              />

              {/* ACTION */}
              {mapped.status === "pending" && (
                <ActionButtons
                  onReject={() => {
                    setActionType("ditolak");
                    setShowConfirm(true);
                  }}
                  onAccept={() => {
                    setActionType("terverifikasi");
                    setShowConfirm(true);
                  }}
                  isLoading={mutation.isPending}
                />
              )}
          </div>
        </main>

        <BottomNav role="admin"/>
      </div>

      {/* MODAL */}
      <ConfirmActionModal
        open={showConfirm}
        actionType={actionType}
        selectedItem={mapped}
        reason={reason}
        setReason={setReason}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          if (actionType === "ditolak" && !reason.trim()) {
            alert("Alasan wajib diisi!");
            return;
          }

          mutation.mutate({
            id: mapped.id,
            action: actionType,
            reason,
          });
        }}
        isLoading={mutation.isPending}
      />
    </div>
  );
}
