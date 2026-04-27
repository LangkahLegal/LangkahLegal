import { MaterialIcon } from "@/components/ui/Icons";

const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2 text-[#aca8c1] text-sm">
      <MaterialIcon name={icon} className="text-blue-400 text-sm" />
      <span>{label}</span>
    </div>

    <span className="text-white text-sm font-medium">
      {value || "-"}
    </span>
  </div>
);

export default function InformasiProfesional({
  gelar,
  pendidikan,
  nomorIzin,
  pengalaman,
  kota,
  email,
}) {
  return (
    <section className="space-y-6 w-full">

      {/* ================= PROFESIONAL ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
          <h2 className="text-base font-bold text-white uppercase tracking-tight">
            Informasi Profesional
          </h2>
        </div>

        <div className="bg-[#1f1d35]/40 border border-white/5 rounded-2xl p-5 space-y-2">
          <InfoRow label="Gelar Akademik" value={gelar} icon="school" />
          <InfoRow label="Pendidikan Terakhir" value={pendidikan} icon="menu_book" />
          <InfoRow label="No. Izin Praktik" value={nomorIzin} icon="badge" />
          <InfoRow
            label="Pengalaman Praktik"
            value={pengalaman ? `${pengalaman} tahun` : null}
            icon="work_history"
          />
        </div>
      </div>

      {/* ================= KONTAK ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
          <h2 className="text-base font-bold text-white uppercase tracking-tight">
            Lokasi & Kontak
          </h2>
        </div>

        <div className="bg-[#1f1d35]/40 border border-white/5 rounded-2xl p-5 space-y-2">
          <InfoRow label="Kota Praktik" value={kota} icon="location_on" />
          <InfoRow label="Email" value={email} icon="mail" />
        </div>
      </div>

    </section>
  );
}