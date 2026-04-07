"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AvatarUpload from "@/components/setting/profile/AvatarUpload";
import ProfileForm from "@/components/setting/profile/ProfileForm";
import BottomNav from "@/components/layout/BottomNav";
import SettingHeader from "@/components/setting/SettingHeader";
import { userService } from "@/services/user.service";

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    kota_praktik: "",
    spesialisasi: "",
    pengalaman_tahun: "",
    tarif_per_sesi: "",
    linkedin: "",
    avatar: "",
  });

  const [userRole, setUserRole] = useState("client");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getFullProfile();

        setFormData({
          name: data.nama || "",
          email: data.email || "",
          kota_praktik: data.kota_praktik || "",
          spesialisasi: data.spesialisasi || "",
          pengalaman_tahun: data.pengalaman_tahun || "",
          tarif_per_sesi: data.tarif_per_sesi || "",
          linkedin: data.portofolio || "",
          avatar: data.avatar || "",
        });

        setUserRole(data.role || "client");
      } catch (err) {
        console.error("Gagal ambil profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const payload = {
      nama: formData.name,
      avatar: formData.avatar,
      kota_praktik: formData.kota_praktik,
      spesialisasi: formData.spesialisasi,
      pengalaman_tahun: Number(formData.pengalaman_tahun),
      tarif_per_sesi: Number(formData.tarif_per_sesi),
      portofolio: formData.linkedin,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === null) {
        delete payload[key];
      }
    });

    await userService.updateProfile(payload);
    } catch (err) {
      console.error("Gagal update:", err);
      alert("Gagal menyimpan profil");
    }
  };

  if (loading) {
    return (
      <div className="text-white flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

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