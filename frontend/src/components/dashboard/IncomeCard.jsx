import { MaterialIcon } from "@/components/ui";

export default function IncomeCard({ amount = "Rp 0" }) {
  // Update: Menggunakan bg-[#261E58], border tipis, dan shadow yang lebih dalam
  const cardStyles = `
    relative overflow-hidden 
    bg-[#261E58]/50
    border border-white/10
    p-8 rounded-[2.5rem] 
    shadow-2xl shadow-black/20 
    group transition-all duration-500 
    hover:shadow-[#261E58]/40 
    flex justify-between items-center 
    w-full
  `;

  return (
    <section className="w-full">
      <div className={cardStyles.trim()}>
        {/* Konten Teks Identitas Pendapatan */}
        <div className="relative z-10">
          <p className="text-[#aca8c1] font-medium mb-2 text-sm lg:text-base tracking-wide">
            Jumlah Pendapatan Tersimpan
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">
            {amount}
          </h2>
        </div>

        {/* Logo Dompet Kanan (Glassmorphism Effect) */}
        <div className="relative z-10 w-14 h-14 lg:w-20 lg:h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:bg-[#6f59fe]/20 group-hover:border-[#6f59fe]/30 transition-all duration-500">
          <MaterialIcon
            name="account_balance_wallet"
            className="text-3xl lg:text-4xl text-[#ada3ff] group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Watermark Dekoratif (Background) 
            Opacity dikecilkan agar tidak mengganggu teks utama pada bg gelap
        */}
        <MaterialIcon
          name="payments"
          className="absolute -bottom-6 -right-6 text-[12rem] text-white/[0.03] -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000 pointer-events-none"
        />
      </div>
    </section>
  );
}
