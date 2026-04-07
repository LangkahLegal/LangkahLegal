import { useRef } from "react";
import PortoUpload from "@/components/setting/profile/PortoUpload"; 
import LinkedInField from "@/components/setting/profile/LinkedInField"; 
import { InputField } from "@/components/ui";

export default function ProfileForm({ data, onChange, role }) {

  const isConsultant = role === "konsultan";

  return (
    <div className="space-y-6">
      {/* === SELALU MUNCUL UNTUK SEMUA ROLE === */}
      <InputField
        label="Nama Lengkap"
        type="text"
        value={data.name}
        onChange={(val) => onChange("name", val)}
      />
      <InputField
        label="Email"
        type="email"
        value={data.email}
        onChange={(val) => onChange("email", val)}
      />

      {/* === HANYA MUNCUL JIKA ROLE ADALAH KONSULTAN === */}
      {isConsultant && (
        <>
          <InputField
            label="Kota Praktik"
            type="text"
            value={data.kota_praktik || ""}
            onChange={(val) => onChange("kota_praktik", val)}
          />
          <InputField
            label="Spesialisasi"
            type="text"
            value={data.spesialisasi || ""}
            onChange={(val) => onChange("spesialisasi", val)}
          />
          <InputField
            label="Pengalaman Praktik (Tahun)"
            type="number"
            value={data.pengalaman_tahun || ""}
            onChange={(val) => onChange("pengalaman_tahun", val)}
          />
          <InputField
            label="Tarif Konsultasi per Sesi (Rp)"
            type="number"
            value={data.tarif_per_sesi || ""}
            onChange={(val) => onChange("tarif_per_sesi", val)}
          />
          <PortoUpload
            file={data.porto}
            onChange={(val) => onChange("porto", val)}
          />
          <LinkedInField
            value={data.linkedin}
            onChange={(val) => onChange("linkedin", val)}
          />
        </>
      )}
    </div>
  );
}