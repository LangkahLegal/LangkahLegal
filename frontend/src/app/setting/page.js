"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";

// Import Layout Components
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

// Import Local Components
import ProfileCard from "@/components/setting/ProfileCard";
import SettingsGroup from "@/components/setting/SettingsGroup";

const ACCOUNT_SETTINGS = [
  {
    id: "profile",
    icon: "person",
    label: "Profil Saya",
    description: "Kelola data pribadi Anda",
    path: "/setting/profile",
  },
  {
    id: "language",
    icon: "language",
    label: "Bahasa",
    description: "Bahasa Indonesia",
    path: "/setting/language",
  },
  {
    id: "theme",
    icon: "contrast",
    label: "Tema Aplikasi",
    description: "Gelap",
    path: "/setting/theme",
  },
  {
    id: "security",
    icon: "lock",
    label: "Keamanan & Sandi",
    description: "Perbarui sandi anda",
    path: "/setting/security",
  },
];

export default function SettingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- 1. Fetch User Profile (Menggunakan Cache yang sama dengan Dashboard) ---
  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: userService.getFullProfile,
    select: (data) => ({
      name: data.nama || data.nama_lengkap,
      email: data.email,
      foto_profil: data.foto_profil || data.avatar || "",
      role: data.role || "client",
      status_verifikasi: data.status_verifikasi,
    }),
  });

  // --- 2. Mutation untuk Logout ---
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Bersihkan seluruh cache agar data user lama tidak tersisa di browser
      queryClient.clear();
      router.replace("/auth/login");
    },
    onError: (err) => {
      console.error("Gagal logout:", err);
      // Tetap arahkan ke login jika sesi sudah expired di server
      router.replace("/auth/login");
    },
  });

  const userRole = user?.role || "client";

  const INFO_SETTINGS = [
    {
      id: "about",
      icon: "info",
      label: "Tentang LangkahLegal",
      description: "Versi 2.4.0 (Stable)",
      path: "/setting/about",
    },
    {
      id: "logout",
      icon: "logout",
      label: "Keluar",
      description: "Hapus sesi dari perangkat ini",
      variant: "danger",
      onClick: () => {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
          logoutMutation.mutate();
        }
      },
    },
  ];

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden">
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader
          title="Pengaturan"
          onSettingsClick={() => router.push("/setting")}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {/* --- Profile Section --- */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-8 h-8 border-2 border-[#ada3ff]/30 border-t-[#ada3ff] rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold tracking-widest text-[#aca8c1] uppercase animate-pulse">
                  Loading Profile...
                </p>
              </div>
            ) : user ? (
              <ProfileCard user={user} />
            ) : (
              <div className="text-center py-10 text-muted">
                Profil tidak ditemukan.
              </div>
            )}

            {/* --- Settings Groups --- */}
            <SettingsGroup title="Akun & Preferensi" items={ACCOUNT_SETTINGS} />

            <div
              className={
                logoutMutation.isPending ? "opacity-50 pointer-events-none" : ""
              }
            >
              <SettingsGroup title="Informasi" items={INFO_SETTINGS} />
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role={userRole} />
        </div>
      </div>
    </div>
  );
}
