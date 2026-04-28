"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

import PageHeader from "@/components/layout/PageHeader";
import ConsultantHero from "@/components/explore/pengajuan/ConsultantHero";
import PriceCard from "@/components/explore/pengajuan/PriceCard";
import SidebarAdmin from "@/components/layout/SidebarAdmin";
import BottomNavAdmin from "@/components/layout/BottomNavAdmin";
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
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#ada3ff] text-[10px] font-bold uppercase animate-pulse">
            Memuat Data...
          </p>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-white">
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
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <SidebarAdmin />

      <div className="flex-1 flex flex-col lg:ml-64">
        <PageHeader title="Detail Verifikasi" backHref="/verification" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10">

            {/* CONTENT */}
              <ConsultantHero
                name={mapped.nama}
                avatar={mapped.foto}
                rating={`${mapped.rating} (${mapped.reviews})`}
                linkedinUrl={mapped.linkedin}
                portofolioUrl={mapped.portofolio}
              />

              {/* STATUS */}
              <div className="flex justify-center gap-2">
                <span className={`px-3 py-1 text-xs rounded-full
                  ${mapped.status === "terverifikasi"
                    ? "bg-green-400/10 text-green-400"
                    : mapped.status === "pending"
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "bg-red-400/10 text-red-400"}`}>
                  {mapped.status}
                </span>

                <span className={`px-3 py-1 text-xs rounded-full
                  ${mapped.aktif
                    ? "bg-blue-400/10 text-blue-400"
                    : "bg-gray-400/10 text-gray-400"}`}>
                  {mapped.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              {mapped.bio && (
                <p className="text-sm text-center italic text-[#aca8c1]">
                  "{mapped.bio}"
                </p>
              )}

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

        <BottomNavAdmin />
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
