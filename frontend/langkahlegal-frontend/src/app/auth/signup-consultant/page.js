"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, InputField, PasswordField, GoogleIcon, MaterialIcon } from "../../../components/ui";

export default function SignupConsultantPage() {
  const SPECIALIZATIONS_LIST = [
    "Perdata", 
    "Pidana", 
    "Bisnis", 
    "Keluarga", 
    "Ketenagakerjaan"
  ];
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    specialization: [],
    experience: "",
    rate: "",
  });
  const router = useRouter();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSpecializationToggle = (spec) => {
    setFormData((prev) => {
      const currentSpecs = prev.specialization;
      if (currentSpecs.includes(spec)) {
        return { ...prev, specialization: currentSpecs.filter((s) => s !== spec) };
      } 
      else {
        return { ...prev, specialization: [...currentSpecs, spec] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.specialization.length === 0) {
      alert("Mohon pilih minimal satu spesialisasi.");
      return;
    }

    console.log("Data Submit:", formData);
    router.push("/auth/verify");
  };

  return (
    <div className="auth-screen">
      <div className="glow-top-left" />
      <div className="glow-bottom-right" />

      {/* Side decoration (desktop only) */}
      <div className="hidden lg:block fixed -right-20 top-1/4 w-80 h-80 opacity-20 rotate-12 pointer-events-none">
        <div className="w-full h-full rounded-[4rem] border-[40px] border-[#9e93ff] blur-sm" />
      </div>

      <main className="auth-container space-y-8">
        <header className="text-center space-y-3">
          <h1 className="auth-title text-4xl">Daftar sebagai Konsultan</h1>
          <p className="text-[#aca8c1] text-base px-4">
            Bergabunglah bersama LangkahLegal untuk memberikan layanan hukum profesional.
          </p>
        </header>

        <section className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <InputField
              label="Nama Lengkap"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="example@langkahlegal.id"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <PasswordField
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <InputField
              label="Kota Praktik"
              name="city"
              type="text"
              placeholder="Bandung"
              value={formData.city}
              onChange={handleChange}
              required
            />

            {/* UI Chips Spesialisasi dengan Icon X */}
            <div className="form-field">
              <label className="form-label">
                Spesialisasi <span className="text-[#aca8c1] font-normal text-xs ml-1">(Bisa pilih lebih dari satu)</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SPECIALIZATIONS_LIST.map((spec) => {
                  const isSelected = formData.specialization.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecializationToggle(spec)}
                      // Tambahkan flex dan items-center agar teks dan icon 'X' sejajar
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        isSelected
                          ? "bg-[#6f59fe] text-white border-[#6f59fe] shadow-[0_0_15px_rgba(111,89,254,0.4)] pr-3" // pr-3 agar jarak icon X ke ujung kanan pas
                          : "bg-[#131125] text-[#aca8c1] border-[#2a2840] hover:border-[#ada3ff]/50"
                      }`}
                    >
                      <span>{spec}</span>
                      
                      {/* Tampilkan icon X HANYA jika tombol sedang dipilih */}
                      {isSelected && (
                        <MaterialIcon 
                          name="close" 
                          className="text-[16px] opacity-80 hover:opacity-100 transition-opacity" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <InputField
              label="Pengalaman Praktik (Tahun)"
              name="experience"
              type="number"
              placeholder="3"
              value={formData.experience}
              onChange={handleChange}
              required
            />

            {/* Input Tarif dengan Prefix Rp */}
            <div className="form-field">
              <label htmlFor="rate" className="form-label">Tarif Konsultasi per Sesi</label>
              <div className="relative flex items-center">
                <span className="absolute left-5 text-[#aca8c1] pointer-events-none font-semibold select-none">
                Rp
                </span>
                <input
                  id="rate"
                  name="rate"
                  type="number"
                  placeholder="250.000"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                  className="form-input w-full !pl-14"
                />
              </div>
            </div>

            <Button type="submit" className="mt-4 w-full">
              Daftar sebagai Konsultan
            </Button>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Atau daftar dengan</span>
            <div className="auth-divider-line" />
          </div>

          <Button variant="social" type="button" className="w-full">
            <GoogleIcon />
            Daftar dengan Google
          </Button>
        </section>

        <footer className="text-center pt-4">
          <p className="text-[#aca8c1] text-sm font-medium">
            Sudah memiliki akun?{" "}
            <Link href="/auth/login" className="link-accent ml-1">Masuk Sekarang</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}