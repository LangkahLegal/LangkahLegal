"use client";

import { useRouter } from "next/navigation";
import ProfileCard from "@/components/setting/ProfileCard";
import SettingsGroup from "@/components/setting/SettingsGroup";
import BottomNav from "@/components/layout/BottomNav";
import SettingHeader from "@/components/setting/SettingHeader";

const USER_DATA = {
  name: "User Pengguna",
  email: "user@email.com",
  avatar: "/api/placeholder/80/80",
  isPremium: true,
};

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
    onClick: () => console.log("logout"),
  },
];

export default function SettingPage() {
  const router = useRouter();

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen pb-32 font-['Inter',sans-serif]">
      {/* Header */}
      <SettingHeader
        title="Pengaturan"
        icon="gavel"
        onSettingsClick={() => console.log("Open Settings")}
        />

      <main className="px-6 mt-8 space-y-8">
        <ProfileCard user={USER_DATA} />

        <SettingsGroup title="Akun & Preferensi" items={ACCOUNT_SETTINGS} />
        <SettingsGroup title="Informasi" items={INFO_SETTINGS} />

      </main>

      <BottomNav />
    </div>
  );
}