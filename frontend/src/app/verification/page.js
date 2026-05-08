"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/layout/PageHeader";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import SearchBar from "@/components/layout/SearchBar";
import { MaterialIcon } from "@/components/ui/Icons";
import ConsultantCard from "@/components/verification/VerificationCard";
import CategoryList from "@/components/dashboard/CategoryList";
import ConfirmActionModal from "@/components/verification/ConfirmActionModal";

import { getConsultants, verifyConsultant } from "@/services/admin.service";
import { useTheme } from "@/providers/ThemeProvider"; 

export default function VerificationListPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");

  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme(); // Gunakan state tema saat ini

  // --- 1. Mapping Warna Avatar (Sinkron dengan History) ---
  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };
  const activeColors = themeColors[theme] || themeColors["dark-tech"];

  // --- 2. Fetch Data ---
  const { data: allData } = useQuery({
    queryKey: ["consultants", "all"],
    queryFn: () => getConsultants(),
  });

  const { data: categoryData, isLoading } = useQuery({
    queryKey: ["consultants", activeCategory],
    queryFn: () => getConsultants(activeCategory),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action, reason }) => verifyConsultant(id, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["consultants"]);
      setShowConfirm(false);
      setReason("");
    },
  });

  const { filteredConsultants, statusCategories } = useMemo(() => {
    const rawAll = allData?.data || [];
    const rawCategory = categoryData?.data || [];

    const formatTanggal = (date) =>
      date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

    const formatWaktu = (date) =>
      date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    // Transformasi data dengan Avatar Dinamis
    const mapped = rawCategory.map((item) => {
      const dateObj = new Date(item.updated_at || item.created_at);
      return {
        id: item.id_konsultan,
        nama_lengkap: item.nama_lengkap,
        spesialisasi: item.spesialisasi,
        kota_praktik: item.kota_praktik,
        pengalaman_tahun: item.pengalaman_tahun,
        tarif_per_sesi: item.tarif_per_sesi,
        status: item.status_verifikasi,
        waktu_submit: { date: formatTanggal(dateObj), time: formatWaktu(dateObj) },
        foto_profil: item.foto_profil || item.users?.foto_profil ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama_lengkap)}&background=${activeColors.bg}&color=${activeColors.color}`,
      };
    });

    const filtered = mapped.filter((pro) => {
      const keyword = search.toLowerCase();
      return (
        pro.nama_lengkap.toLowerCase().includes(keyword) ||
        pro.spesialisasi?.toLowerCase().includes(keyword)
      );
    });

    const categories = [
      { id: "all", label: `Semua (${rawAll.length})` },
      { id: "pending", label: `Pending (${rawAll.filter((i) => i.status_verifikasi === "pending").length})` },
      { id: "terverifikasi", label: `Terverifikasi (${rawAll.filter((i) => i.status_verifikasi === "terverifikasi").length})` },
      { id: "ditolak", label: `Ditolak (${rawAll.filter((i) => i.status_verifikasi === "ditolak").length})` },
    ];

    return { filteredConsultants: filtered, statusCategories: categories };
  }, [allData, categoryData, search, activeColors]);

  return (
    <div className="bg-bg text-main font-primary min-h-screen flex overflow-hidden transition-colors duration-500">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col relative min-w-0 w-full lg:ml-64 transition-all duration-300">
        <PageHeader title="Ajuan Verifikasi" backHref="/dashboard/admin" />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">
            <div className="space-y-4">
              <SearchBar value={search} onChange={setSearch} />

              <CategoryList
                title="Status Verifikasi"
                categories={statusCategories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    Memuat Data...
                  </p>
                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted">
                  <MaterialIcon name="search_off" className="text-4xl mb-2 opacity-50" />
                  <p className="text-sm font-medium">Tidak ada data ditemukan</p>
                </div>
              ) : (
                <div className="mt-10 grid sm:grid-cols-2 gap-4 lg:gap-6">
                  {filteredConsultants.map((item) => (
                    <ConsultantCard
                      key={item.id}
                      item={item}
                      onDetail={(i) => router.push(`/verification/${i.id}`)}
                      onApprove={(i) => {
                        setSelectedItem(i);
                        setActionType("terverifikasi");
                        setShowConfirm(true);
                      }}
                      onReject={(i) => {
                        setSelectedItem(i);
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
          <BottomNav role="admin" />
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
            mutation.mutate({ id: selectedItem.id, action: actionType, reason });
          }}
        />
      </div>
    </div>
  );
}