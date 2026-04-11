import { MaterialIcon } from "@/components/ui/Icons";

export default function UploadSection() {
  return (
    <section className="relative group">
      <div className="border-2 border-dashed border-[#6f59fe]/30 rounded-[2rem] p-8 flex flex-col items-center justify-center bg-[#1f1d35]/30 hover:bg-[#1f1d35]/50 hover:border-[#6f59fe]/60 transition-all cursor-pointer">
        <div className="w-16 h-16 rounded-full bg-[#6f59fe]/20 flex items-center justify-center mb-4 shadow-2xl group-hover:scale-110 transition-transform">
          <MaterialIcon
            name="cloud_upload"
            className="text-[#6f59fe] text-3xl"
          />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          Unggah Berkas Baru
        </h3>
        <p className="text-[#aca8c1] text-xs mb-6 text-center">
          PDF, DOCX, JPG, PNG (Maks. 10MB)
        </p>
        <button className="bg-[#6f59fe] text-white px-8 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(111,89,254,0.4)] transition-all active:scale-95">
          Pilih File
        </button>
      </div>
    </section>
  );
}
