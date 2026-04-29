"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AvatarUpload from "@/components/setting/profile/AvatarUpload";
import ProfileForm from "@/components/setting/profile/ProfileForm";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui";

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- 1. State Lokal untuk Form ---
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

  const [portofolioFile, setPortofolioFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark-tech");

  // --- 2. Deteksi Tema untuk Fallback Avatar ---
  useEffect(() => {
    const detectTheme = () => {
      const htmlClasses = document.documentElement.classList;
      if (htmlClasses.contains("theme-white-modern"))
        return "theme-white-modern";
      if (htmlClasses.contains("theme-cyber-slate")) return "theme-cyber-slate";
      return "dark-tech";
    };
    setCurrentTheme(detectTheme());
  }, []);

  // --- 3. Fetch Data Profil ---
  const { data: profile, isLoading: isQueryLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: userService.getFullProfile,
  });

  // Sync data dari Query ke State Lokal Form
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile?.nama || "",
        nama_lengkap: profile?.nama_lengkap || "",
        email: profile?.email || "",
        kota_praktik: profile?.kota_praktik || "",
        spesialisasi: profile?.spesialisasi || "",
        pengalaman_tahun: profile?.pengalaman_tahun || "",
        tarif_per_sesi: profile?.tarif_per_sesi || "",
        linkedin: profile?.linkedin || "",
        portofolio: profile?.portofolio || "",
        foto_profil: profile?.foto_profil || "",
        bio_singkat: profile?.bio_singkat || "",
        deskripsi_lengkap: profile?.deskripsi_lengkap || "",
        nomor_izin_praktik: profile?.nomor_izin_praktik || "",
        gelar_akademik: profile?.gelar_akademik || "",
        pendidikan_terakhir: profile?.pendidikan_terakhir || "",
      });
    }
  }, [profile]);

  // --- 4. Mutation untuk Update Profil ---
  const updateMutation = useMutation({
    mutationFn: (payload) => userService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      router.push("/setting");
    },
    onError: (error) => {
      console.error("Gagal update profil:", error);
      alert("Gagal menyimpan perubahan.");
    },
  });

  const userRole = profile?.role || "client";

  const handleChange = (field, value) => {
    if (field === "portofolio_file") {
      setPortofolioFile(value);
      if (value !== null) {
        setFormData((prev) => ({ ...prev, portofolio: "new_upload_pending" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePhotoChange = (newUrl) => {
    setFormData((prev) => ({ ...prev, foto_profil: newUrl }));
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (isUploading || updateMutation.isPending) return;

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
      bio_singkat: formData.bio_singkat,
      deskripsi_lengkap: formData.deskripsi_lengkap,
      nomor_izin_praktik: formData.nomor_izin_praktik,
      gelar_akademik: formData.gelar_akademik,
      pendidikan_terakhir: formData.pendidikan_terakhir,
      portofolio: formData.portofolio,
      portofolio_file: portofolioFile,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, v]) => {
        if (key === "portofolio" && v === "") return true;
        return v !== "" && v !== null && v !== undefined;
      }),
    );

    updateMutation.mutate(cleanPayload);
  };

  // --- RENDER LOADING STATE (Theme Aware) ---
  if (isQueryLoading)
    return (
      /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-white -> text-main */
      <div className="bg-bg text-main flex flex-col justify-center items-center h-screen gap-4 transition-colors duration-500">
        {/* REFACTOR: border-[#ada3ff] -> border-primary */}
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        {/* REFACTOR: text-[#aca8c1] -> text-muted */}
        <p className="animate-pulse text-muted text-[10px] font-bold tracking-widest uppercase">
          Syncing Profile...
        </p>
      </div>
    );

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main */
    <div className="bg-bg text-main min-h-screen flex w-full transition-colors duration-500">
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Edit Profil" />

        <main className="flex-1 overflow-y-auto scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full px-5 pt-8 pb-32 lg:pb-12 space-y-8 animate-fade-in">
            <div className="relative mb-12">
              <AvatarUpload
                foto_profil={formData.foto_profil}
                // Safety: Pastikan name tidak undefined untuk fallback avatar
                name={formData.name || formData.nama_lengkap || "User"}
                isUploading={isUploading}
                onUploadStart={() => setIsUploading(true)}
                onChange={handlePhotoChange}
                // Optional: Kirim theme info jika AvatarUpload membutuhkannya secara eksplisit
                theme={currentTheme}
              />
            </div>

            <ProfileForm
              data={formData}
              onChange={handleChange}
              role={userRole}
              portofolioFile={portofolioFile}
            />

            <div className="mt-12">
              <Button
                onClick={handleSave}
                isLoading={isUploading || updateMutation.isPending}
                disabled={isUploading || updateMutation.isPending}
                fullWidth
              >
                {isUploading
                  ? "Uploading Photo..."
                  : updateMutation.isPending
                    ? portofolioFile
                      ? "Mengunggah Portofolio..."
                      : "Saving..."
                    : "Simpan Perubahan"}
              </Button>
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
