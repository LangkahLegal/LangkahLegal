"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

import PageHeader from "@/components/layout/PageHeader";
import ConsultantHero from "@/components/explore/pengajuan/ConsultantHero";
import PriceCard from "@/components/explore/pengajuan/PriceCard";
import SidebarAdmin from "@/components/layout/SidebarAdmin";
import BottomNavAdmin from "@/components/layout/BottomNavAdmin"
import AboutSection from "@/components/explore/pengajuan/AboutSection";
import InfoCard from "@/components/verification/InfoCard";
import ActionButtons from "@/components/request/ActionButtons";
import { getConsultantDetail, verifyConsultant } from "@/services/admin.service";

export default function VerificationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["consultantDetail", id],
    queryFn: () => getConsultantDetail(Number(id)),
    enabled: !!id,
  });

  
  const mutation = useMutation({
    mutationFn: (action) => verifyConsultant(Number(id), action),
    onSuccess: () => {
      router.push("/verification");
    },
  });

  const consultant = data?.data;

  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          
          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>

          {/* Text */}
          <p className="text-[#ada3ff] text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Memuat Data...
          </p>

        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-white">
        <p>Data Konsultan Tidak Ditemukan</p>
      </div>
    );
  }

  const mapped = {
    id: consultant.id_konsultan,
    nama: consultant.nama_lengkap,
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

            <div className="p-6 space-y-6">

              {/* HERO */}
              <ConsultantHero
                name={mapped.nama}
                avatar={mapped.foto}
                rating={`${mapped.rating} (${mapped.reviews})`}
                linkedinUrl={mapped.linkedin}
                portofolioUrl={mapped.portofolio}
              />

              <div className="flex flex-col items-center gap-2 -mt-2">

                {/* STATUS */}
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full
                    ${
                      mapped.status === "terverifikasi"
                        ? "bg-green-400/10 text-green-400"
                        : mapped.status === "pending"
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {mapped.status}
                  </span>

                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full
                    ${
                      mapped.aktif
                        ? "bg-blue-400/10 text-blue-400"
                        : "bg-gray-400/10 text-gray-400"
                    }`}
                  >
                    ● {mapped.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              {/* BIO */}
              {mapped.bio && (
                <p className="text-sm text-[#aca8c1] text-center -mt-4 italic">
                  "{mapped.bio}"
                </p>
              )}

              {/* PRICE */}
              <PriceCard
                price={
                  mapped.tarif
                    ? `${mapped.tarif.toLocaleString("id-ID")}`
                    : "Belum diatur"
                }
              />

              {/* INFO */}
              <InfoCard
                gelar={mapped.gelar}
                pendidikan={mapped.pendidikan}
                nomorIzin={mapped.izin}
                pengalaman={mapped.pengalaman}
                kota={mapped.kota}
                email={mapped.email}
              />

              {/* DESKRIPSI */}
              <AboutSection
                bio={mapped.deskripsi}
                tags={
                  mapped.spesialisasi
                    ? mapped.spesialisasi.split(",")
                    : []
                }
              />

            </div>

            {/* ACTION */}
            {mapped.status === "pending" && (
              <ActionButtons
                onReject={() => mutation.mutate("ditolak")}
                onAccept={() => mutation.mutate("terverifikasi")}
                isLoading={mutation.isPending}
              />
            )}
          </div>
        </main>

        <BottomNavAdmin />
      </div>
    </div>
  );
}