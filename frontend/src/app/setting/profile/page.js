"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AvatarUpload from "@/components/setting/profile/AvatarUpload";
import ProfileForm from "@/components/setting/profile/ProfileForm";
import Sidebar from "@/components/layout/Sidebar"; // Tambahkan Sidebar
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader"; // Ganti ke PageHeader
import { userService } from "@/services/user.service";

export default function EditProfilePage() {
  const router = useRouter();

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
      try {
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
          bio_singkat: data.bio_singkat || "",
          deskripsi_lengkap: data.deskripsi_lengkap || "",
          nomor_izin_praktik: data.nomor_izin_praktik || "",
          gelar_akademik: data.gelar_akademik || "",
          pendidikan_terakhir: data.pendidikan_terakhir || "",
        });
        setUserRole(data.role || "client");
        setLoading(false);
      } catch (err) {
        console.error("Gagal fetch profil:", err);
        setLoading(false);
      }
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
      bio_singkat: formData.bio_singkat,
      deskripsi_lengkap: formData.deskripsi_lengkap,
      nomor_izin_praktik: formData.nomor_izin_praktik,
      gelar_akademik: formData.gelar_akademik,
      pendidikan_terakhir: formData.pendidikan_terakhir,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    try {
      await userService.updateProfile(cleanPayload);
      router.refresh();
      router.push("/setting");
    } catch (err) {
      console.error("Gagal update profil:", err);
    } finally {
      setIsSaving(false);
    }
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
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      {/* Sidebar untuk Desktop */}
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        {/* PageHeader Standar Layout menggantikan SettingHeader */}
        <PageHeader title="Edit Profil" />

        <main className="flex-1 overflow-y-auto px-6 pt-8 pb-32 scroll-smooth">
          <div className="max-w-2xl mx-auto w-full">
            <div className="relative mb-12">
              <AvatarUpload
                foto_profil={formData.foto_profil}
                name={formData.name || formData.nama_lengkap}
                isUploading={isUploading}
                onUploadStart={() => setIsUploading(true)}
                onChange={handlePhotoChange}
              />
            </div>

            <ProfileForm
              data={formData}
              onChange={handleChange}
              role={userRole}
            />

            <div className="mt-12">
              <button
                onClick={handleSave}
                disabled={isUploading || isSaving}
                className={`w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg flex justify-center items-center gap-3 ${
                  isUploading || isSaving
                    ? "bg-white/5 text-[#aca8c1] cursor-not-allowed opacity-50 border border-white/5"
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
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role={userRole} />
        </div>
      </div>
    </div>
  );
}
