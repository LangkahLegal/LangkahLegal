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

  // State dengan tambahan field kredensial konsultan
  const [formData, setFormData] = useState({
    name: "",
    nama_lengkap: "",
    email: "",
    kota_praktik: "",
    spesialisasi: "",
    pengalaman_tahun: "",
    tarif_per_sesi: "",
    linkedin: "",
    portofolio: "",
    foto_profil: "",
    // Field Baru
    bio_singkat: "",
    deskripsi_lengkap: "",
    nomor_izin_praktik: "",
    gelar_akademik: "",
    pendidikan_terakhir: "",
  });

  const [userRole, setUserRole] = useState("client");
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await userService.getFullProfile();

      setFormData({
        name: data.nama || "",
        nama_lengkap: data.nama_lengkap || "",
        email: data.email || "",
        kota_praktik: data.kota_praktik || "",
        spesialisasi: data.spesialisasi || "",
        pengalaman_tahun: data.pengalaman_tahun || "",
        tarif_per_sesi: data.tarif_per_sesi || "",
        linkedin: data.linkedin || "",
        portofolio: data.portofolio || "",
        foto_profil: data.foto_profil || data.avatar || "",
        // Mapping Field Baru
        bio_singkat: data.bio_singkat || "",
        deskripsi_lengkap: data.deskripsi_lengkap || "",
        nomor_izin_praktik: data.nomor_izin_praktik || "",
        gelar_akademik: data.gelar_akademik || "",
        pendidikan_terakhir: data.pendidikan_terakhir || "",
      });

      setUserRole(data.role || "client");
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (newUrl) => {
    setFormData((prev) => ({ ...prev, foto_profil: newUrl }));
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (isUploading || isSaving) return;
    setIsSaving(true);

    const payload = {
      nama: formData.name,
      nama_lengkap: formData.nama_lengkap,
      foto_profil: formData.foto_profil,
      kota_praktik: formData.kota_praktik,
      spesialisasi: formData.spesialisasi,
      pengalaman_tahun: formData.pengalaman_tahun
        ? Number(formData.pengalaman_tahun)
        : null,
      tarif_per_sesi: formData.tarif_per_sesi
        ? Number(formData.tarif_per_sesi)
        : null,
      linkedin: formData.linkedin,
      portofolio: formData.portofolio,
      // Include Field Baru ke Payload
      bio_singkat: formData.bio_singkat,
      deskripsi_lengkap: formData.deskripsi_lengkap,
      nomor_izin_praktik: formData.nomor_izin_praktik,
      gelar_akademik: formData.gelar_akademik,
      pendidikan_terakhir: formData.pendidikan_terakhir,
    };

    // Membersihkan field kosong agar tidak mengirim string kosong ke DB yang mengharapkan NULL
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    await userService.updateProfile(cleanPayload);

    router.refresh();
    router.push("/setting");
    setIsSaving(false);
  };

  if (loading)
    return (
      <div className="bg-[#0e0c1e] text-white flex flex-col justify-center items-center h-screen gap-4">
        <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse text-[#aca8c1] text-[10px] font-bold tracking-widest uppercase">
          Syncing Profile...
        </p>
      </div>
    );

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col font-['Inter',sans-serif]">
      <SettingHeader
        title="Edit Profil"
        icon="gavel"
        onSettingsClick={() => router.push("/setting")}
      />

      <main className="flex-grow px-6 pt-8 pb-32 max-w-2xl mx-auto w-full">
        <div className="relative mb-12">
          <AvatarUpload
            foto_profil={formData.foto_profil}
            name={formData.name || formData.nama_lengkap}
            isUploading={isUploading}
            onUploadStart={() => setIsUploading(true)}
            onChange={handlePhotoChange}
          />
        </div>

        {/* Form akan secara otomatis menerima field baru melalui prop data */}
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
              ? "Uploading..."
              : isSaving
                ? "Saving..."
                : "Simpan Perubahan"}
          </button>
        </div>
      </main>

      <BottomNav role={userRole} />
    </div>
  );
}
