"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AvatarUpload from "@/components/setting/profile/AvatarUpload"; 
import ProfileForm from "@/components/setting/profile/ProfileForm"; 
import BottomNav from "@/components/layout/BottomNav";
import SettingHeader from "@/components/setting/SettingHeader";

const INITIAL_DATA = {
  name: "Ahmad Fauzi",
  email: "ahmad.fauzi@langkahlegal.id",
  kota_praktik: "Bandung",
  spesialisasi: "Perdata",
  pengalaman_tahun: 3,
  tarif_per_sesi: 250000,
  linkedin: "https://linkedin.com/in/ahmadfauzi",
  avatar: "/api/placeholder/128/128",
  cv: null,
};

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(INITIAL_DATA);
  
  const [userRole, setUserRole] = useState("client");

  useEffect(() => {
    const roleFromUrl = searchParams.get("role");
    const savedRole = localStorage.getItem("role");

    if (roleFromUrl) {
      setUserRole(roleFromUrl);
    } else if (savedRole) {
      setUserRole(savedRole);
    }
  }, [searchParams]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Saving:", formData);
    router.back();
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col font-['Inter',sans-serif]">
      <SettingHeader
              title="Edit Profil"
              icon="gavel"
              onSettingsClick={() => console.log("Open Settings")}
              />

      <main className="flex-grow px-6 pt-8 pb-32">

        <AvatarUpload
          avatar={formData.avatar}
          name={formData.name}
          onChange={(val) => handleChange("avatar", val)}
        />

        <ProfileForm
          data={formData}
          onChange={handleChange}
          role={userRole} 
        />

        <div className="mt-12">
          <button onClick={handleSave} className="btn-primary">
            Simpan Perubahan
          </button>
        </div>
      </main>

      <BottomNav role={userRole} />
    </div>
  );
}