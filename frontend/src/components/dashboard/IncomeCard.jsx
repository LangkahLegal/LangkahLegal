import { MaterialIcon } from "@/components/ui";

export default function IncomeCard({ amount = "Rp 0", className = "" }) {
  const cardStyles = `
    relative overflow-hidden 
    bg-card
    border border-surface
    p-5 lg:p-6 rounded-2xl 
    shadow-soft
    group transition-all duration-500 
    hover:border-primary/30
    flex justify-between items-center 
    w-full ${className}
  `;

  return (
    <section className={`w-full ${className}`}>
      <div className={cardStyles.trim()}>
        {/* Konten Teks Identitas Pendapatan */}
        <div className="relative z-10">
          <p className="text-muted font-medium mb-1 text-xs lg:text-sm tracking-wide">
            Jumlah Pendapatan Tersimpan
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-main tracking-tight">
            {amount}
          </h2>
        </div>

        {/* Logo Dompet Kanan (Sekarang menggunakan aksen bg-secondary/20) */}
        <div className="relative z-10 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/30 backdrop-blur-sm group-hover:bg-secondary/40 group-hover:scale-105 transition-all duration-500 shadow-inner">
          <MaterialIcon
            name="account_balance_wallet"
            className="text-2xl text-primary-light transition-transform duration-500"
          />
        </div>

        {/* Watermark Dekoratif (Background) */}
        <MaterialIcon
          name="payments"
          className="absolute -bottom-4 -right-4 text-[7rem] lg:text-[8rem] text-main/5 -rotate-12 group-hover:rotate-0 group-hover:scale-105 transition-all duration-1000 pointer-events-none"
        />
      </div>
    </section>
  );
}
