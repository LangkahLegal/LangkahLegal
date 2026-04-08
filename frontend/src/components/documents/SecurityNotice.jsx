import { MaterialIcon } from "@/components/ui/Icons";

export default function SecurityNotice() {
  return (
    <div className="bg-[#6f59fe]/5 border border-[#6f59fe]/20 rounded-3xl p-5 flex gap-4 items-start">
      <div className="mt-1">
        <MaterialIcon name="verified_user" className="text-[#6f59fe] text-xl" />
      </div>
      <p className="text-[11px] leading-relaxed text-[#aca8c1]">
        Semua dokumen Anda dienkripsi dengan standar keamanan{" "}
        <span className="text-white font-bold text-[12px]">AES-256</span> dan
        hanya dapat diakses oleh Anda.
      </p>
    </div>
  );
}
