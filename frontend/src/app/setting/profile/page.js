"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AvatarUpload from "@/components/setting/profile/AvatarUpload";
import ProfileForm from "@/components/setting/profile/ProfileForm";
import BottomNav from "@/components/layout/BottomNav";
import SettingHeader from "@/components/setting/SettingHeader";
import { userService } from "@/services/user.service";

export default function EditProfilePage() {
  const router = useRouter();

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
  const [isUploading, setIsUploading] = useState(false); // Status upload ke IMGBB
  const [isSaving, setIsSaving] = useState(false); // Status simpan ke FastAPI

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
          // PENTING: Backend kirim 'foto_profil', kita simpan ke state 'avatar'
          avatar: data.foto_profil || data.avatar || "",
        });

        setUserRole(data.role || "client");
      } catch (err) {
        console.error("Senior FE Error - Gagal fetch profil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handler saat IMGBB berhasil memberikan URL permanen
   */
  const handleAvatarChange = (newUrl) => {
    console.log("Senior FE Debug - URL IMGBB masuk ke state:", newUrl);
    setFormData((prev) => ({
      ...prev,
      avatar: newUrl, // Link https://i.ibb.co/...
    }));
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (isUploading || isSaving) return;

    try {
      setIsSaving(true);

      // Proteksi: Pastikan tidak mengirim blob/localhost
      if (
        formData.avatar.startsWith("blob:") ||
        formData.avatar.includes("localhost")
      ) {
        alert("Peringatan: Foto profil belum terunggah ke server cloud.");
        setIsSaving(false);
        return;
      }

      // Payload disesuaikan dengan skema ProfileUpdatePayload di Backend
      const payload = {
        nama: formData.name,
        avatar: formData.avatar,
        kota_praktik: formData.kota_praktik,
        spesialisasi: formData.spesialisasi,
        pengalaman_tahun: formData.pengalaman_tahun
          ? Number(formData.pengalaman_tahun)
          : null,
        tarif_per_sesi: formData.tarif_per_sesi
          ? Number(formData.tarif_per_sesi)
          : null,
        portofolio: formData.linkedin,
      };

      // Hapus value null/undefined/kosong agar tidak mengupdate data lama jadi kosong
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, v]) => v !== "" && v !== null && v !== undefined,
        ),
      );

      await userService.updateProfile(cleanPayload);

      // Memaksa Next.js mengambil data terbaru dari server
      router.refresh();
      alert("Profil berhasil diperbarui!");
      router.push("/setting");
    } catch (err) {
      console.error("Senior FE Error - Gagal update:", err);
      alert("Gagal menyimpan profil. Periksa koneksi atau data Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0e0c1e] text-white flex flex-col justify-center items-center h-screen gap-4">
        <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse text-[#aca8c1] tracking-widest uppercase text-[10px] font-bold">
          Menyinkronkan Data...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col font-['Inter',sans-serif]">
      <SettingHeader
        title="Edit Profil"
        icon="gavel"
        onSettingsClick={() => router.push("/setting")}
      />

      <main className="flex-grow px-6 pt-8 pb-32 max-w-2xl mx-auto w-full">
        <div className="relative mb-12">
          {/* Komponen AvatarUpload sekarang reaktif terhadap state formData.avatar */}
          <AvatarUpload
            avatar={formData.avatar}
            name={formData.name}
            isUploading={isUploading}
            onUploadStart={() => setIsUploading(true)}
            onChange={handleAvatarChange}
          />
        </div>

        <ProfileForm data={formData} onChange={handleChange} role={userRole} />

        <div className="mt-12">
          <button
            onClick={handleSave}
            disabled={isUploading || isSaving}
            className={`w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg flex justify-center items-center gap-3 ${
              isUploading || isSaving
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "bg-[#6f59fe] hover:bg-[#5b46e0] text-white shadow-[#6f59fe]/20"
            }`}
          >
            {(isUploading || isSaving) && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isUploading
              ? "Mengunggah Foto..."
              : isSaving
                ? "Menyimpan Data..."
                : "Simpan Perubahan"}
          </button>
        </div>
      </main>

      <BottomNav role={userRole} />
    </div>
  );
}
