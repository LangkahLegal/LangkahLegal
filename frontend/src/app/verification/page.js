"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/layout/PageHeader";
import SidebarAdmin from "@/components/layout/SidebarAdmin";
import BottomNavAdmin from "@/components/layout/BottomNavAdmin";
import SearchBar from "@/components/layout/SearchBar";
import { MaterialIcon } from "@/components/ui/Icons";
import ConsultantCard from "@/components/verification/ConsultantCard";
import CategoryList from "@/components/dashboard/CategoryList";
import ConfirmActionModal from "@/components/verification/ConfirmActionModal";

import { getConsultants, verifyConsultant } from "@/services/admin.service";

export default function VerificationListPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: ({ id, action, reason }) =>
      verifyConsultant(id, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["consultants"]);
      setShowConfirm(false);
      setReason("");
    },
  });


  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: allData } = useQuery({
    queryKey: ["consultants", "all"],
    queryFn: () => getConsultants(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["consultants", activeCategory],
    queryFn: () => getConsultants(activeCategory),
  });

  const allConsultants = allData?.data || [];
  const consultants = data?.data || [];

  const formatTanggal = (date) =>
    date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatWaktu = (date) =>
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const mappedConsultants = consultants.map((item) => {
    const dateObj = new Date(item.created_at);

    return {
      id: item.id_konsultan,
      nama_lengkap: item.nama_lengkap,
      spesialisasi: item.spesialisasi,
      kota_praktik: item.kota_praktik,
      pengalaman_tahun: item.pengalaman_tahun ?? null,
      tarif_per_sesi: item.tarif_per_sesi ?? null,
      status: item.status_verifikasi,
      waktu_submit: {
        date: formatTanggal(dateObj),
        time: formatWaktu(dateObj),
      },
      foto_profil:
        item.foto_profil ||
        item.users?.foto_profil ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          item.nama_lengkap
        )}&background=1f1d35&color=ada3ff`,
    };
  });

  const filteredConsultants = mappedConsultants.filter((pro) => {
    const keyword = search.toLowerCase();

    return (
      pro.nama_lengkap.toLowerCase().includes(keyword) ||
      pro.spesialisasi.toLowerCase().includes(keyword)
    );
  });

  //  Category (pakai ALL data)
  const statusCategories = [
    {
      id: "all",
      label: `Semua (${allConsultants.length})`,
    },
    {
      id: "pending",
      label: `Pending (${
        allConsultants.filter((i) => i.status_verifikasi === "pending").length
      })`,
    },
    {
      id: "terverifikasi",
      label: `Terverifikasi (${
        allConsultants.filter((i) => i.status_verifikasi === "terverifikasi")
          .length
      })`,
    },
    {
      id: "ditolak",
      label: `Ditolak (${
        allConsultants.filter((i) => i.status_verifikasi === "ditolak").length
      })`,
    },
  ];

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] font-['Inter',sans-serif] min-h-screen flex overflow-hidden">
      <SidebarAdmin />

      <div className="flex-1 flex flex-col relative min-w-0 w-full lg:ml-64 transition-all duration-300">
        <PageHeader
          title="Pengajuan Verifikasi"
          backHref="/dashboard/admin"
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="space-y-4">
              {/* Search */}
              <SearchBar value={search} onChange={setSearch} />

              {/* Category */}
              <CategoryList
                categories={statusCategories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              {/* LIST */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  {/* Spinner */}
                  <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>

                  {/* Text */}
                  <p className="text-[#ada3ff] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    Memuat Data Konsultan...
                  </p>

                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#8f8aa8]">
                  <MaterialIcon
                    name="search_off"
                    className="text-4xl mb-2 opacity-50"
                  />

                  <p className="text-sm font-medium">
                    {search
                      ? "Tidak ada hasil ditemukan"
                      : activeCategory === "ditolak"
                      ? "Belum ada konsultan ditolak"
                      : activeCategory === "pending"
                      ? "Belum ada pengajuan pending"
                      : "Belum ada data"}
                  </p>

                  {search && (
                    <p className="text-xs mt-1 opacity-70">
                      Coba kata kunci lain atau ubah filter
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
                  {filteredConsultants.map((item) => (
                    <ConsultantCard
                      key={item.id}
                      item={item}
                      onDetail={(item) =>
                        router.push(`/verification/${item.id}`)
                      }
                      onApprove={(item) => {
                        setSelectedItem(item);
                        setActionType("terverifikasi");
                        setShowConfirm(true);
                      }}
                      onReject={(item) => {
                        setSelectedItem(item);
                        setActionType("ditolak");
                        setShowConfirm(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNavAdmin />
        </div>

        <ConfirmActionModal
          open={showConfirm}
          actionType={actionType}
          selectedItem={selectedItem}
          reason={reason}
          setReason={setReason}
          isLoading={mutation.isPending}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            if (actionType === "ditolak" && !reason.trim()) {
              alert("Alasan wajib diisi!");
              return;
            }

            mutation.mutate({
              id: selectedItem.id,
              action: actionType,
              reason,
            });
          }}
        />
      </div>

      {/* Scrollbar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #48455a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6f59fe; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}