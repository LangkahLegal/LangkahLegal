import { MaterialIcon } from "@/components/ui";

export default function IncomeCard({ amount = "Rp 0" }) {
  // Kita simpan class di variabel agar kode JSX tetap bersih dan mudah dibaca
  const cardStyles =
    "relative overflow-hidden bg-[#8470ff] p-8 rounded-[2rem] shadow-xl shadow-[#8470ff]/10 group transition-all duration-500 hover:shadow-[#8470ff]/20 flex justify-between items-center w-full";

  return (
    <section className="w-full">
      <div className={cardStyles}>
        {/* Konten Teks Identitas Pendapatan */}
        <div className="relative z-10">
          <p className="text-[#0e0c1e]/70 font-medium mb-1">
            Jumlah Pendapatan Tersimpan
          </p>
          <h2 className="text-3xl lg:text-4xl font-headline font-bold text-[#0e0c1e]">
            {amount}
          </h2>
        </div>

        {/* Logo Dompet Kanan */}
        <div className="relative z-10 w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-[#0e0c1e]/10 flex items-center justify-center border border-[#0e0c1e]/5">
          <MaterialIcon
            name="wallet"
            className="text-3xl lg:text-4xl text-[#0e0c1e]"
          />
        </div>

        {/* Watermark Dekoratif (Background) */}
        <MaterialIcon
          name="account_balance_wallet"
          className="absolute top-1/2 -right-6 -translate-y-1/2 text-9xl text-[#0e0c1e]/5 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none opacity-10"
        />
      </div>
    </section>
  );
}
