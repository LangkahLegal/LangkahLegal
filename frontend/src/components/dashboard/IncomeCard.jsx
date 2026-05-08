import { MaterialIcon } from "@/components/ui";

export default function IncomeCard({ amount = "Rp 0" }) {
  // REFACTOR: Container sekarang menggunakan bg-surface (warna dompet sebelumnya)
  const cardStyles = `
    relative overflow-hidden 
    bg-surface
    border border-surface
    p-8 rounded-[2.5rem] 
    shadow-soft
    group transition-all duration-500 
    hover:border-primary/30
    flex justify-between items-center 
    w-full
  `;

  return (
    <section className="w-full">
      <div className={cardStyles.trim()}>
        {/* Konten Teks Identitas Pendapatan */}
        <div className="relative z-10">
          <p className="text-muted font-medium mb-2 text-sm lg:text-base tracking-wide">
            Jumlah Pendapatan Tersimpan
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold text-main tracking-tight">
            {amount}
          </h2>
        </div>

        {/* Logo Dompet Kanan (Sekarang menggunakan aksen bg-secondary/20) */}
        <div className="relative z-10 w-14 h-14 lg:w-20 lg:h-20 rounded-[1.5rem] bg-secondary/20 flex items-center justify-center border border-secondary/30 backdrop-blur-sm group-hover:bg-secondary/40 group-hover:scale-110 transition-all duration-500 shadow-inner">
          <MaterialIcon
            name="account_balance_wallet"
            className="text-3xl lg:text-4xl text-primary-light transition-transform duration-500"
          />
        </div>

        {/* Watermark Dekoratif (Background) */}
        <MaterialIcon
          name="payments"
          className="absolute -bottom-6 -right-6 text-[12rem] text-main/5 -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000 pointer-events-none"
        />
      </div>
    </section>
  );
}
