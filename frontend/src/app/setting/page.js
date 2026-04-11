"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";

// Import Layout Components
import Sidebar from "@/components/layout/Sidebar"; // Tambahkan Sidebar untuk konsistensi Desktop
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
    description: "2FA Aktif • Terakhir diubah 2 bln lalu",
    path: "/setting/security",
  },
];

export default function SettingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("client");

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
      onClick: async () => {
        try {
          await authService.logout();
        } catch (err) {
          console.error("Gagal logout:", err);
        } finally {
          router.replace("/auth/login");
        }
      },
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getFullProfile();
        setUser({
          name: data.nama || data.nama_lengkap,
          email: data.email,
          foto_profil: data.foto_profil || data.avatar || "",
        });
        setUserRole(data.role || "client");
      } catch (err) {
        console.error("Gagal ambil data profil:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden">
      {/* Sidebar untuk Desktop */}
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        {/* PageHeader Global menggantikan SettingHeader */}
        <PageHeader
          title="Pengaturan"
          onSettingsClick={() => router.push("/setting")}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 space-y-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8">
            {user ? (
              <ProfileCard user={user} />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-8 h-8 border-2 border-[#ada3ff]/30 border-t-[#ada3ff] rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold tracking-widest text-[#aca8c1] uppercase">
                  Loading Profile...
                </p>
              </div>
            )}

            <SettingsGroup title="Akun & Preferensi" items={ACCOUNT_SETTINGS} />
            <SettingsGroup title="Informasi" items={INFO_SETTINGS} />
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role={userRole} />
        </div>
      </div>
    </div>
  );
}
