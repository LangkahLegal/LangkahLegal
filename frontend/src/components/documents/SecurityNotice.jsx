import { MaterialIcon } from "@/components/ui/Icons";

export default function SecurityNotice() {
  return (

    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex gap-4 items-start transition-colors duration-500">
      <div className="mt-1">
        {/* REFACTOR: text-[#6f59fe] -> text-primary */}
        <MaterialIcon name="verified_user" className="text-primary text-xl" />
      </div>

      {/* REFACTOR: text-[#aca8c1] -> text-muted */}
      <p className="text-[11px] leading-relaxed text-muted transition-colors">
        Semua dokumen Anda dienkripsi dengan standar keamanan{" "}
        {/* REFACTOR: text-white -> text-main */}
        <span className="text-main font-bold text-[12px]">AES-256</span> dan
        hanya dapat diakses oleh Anda.
      </p>
    </div>
  );
}
