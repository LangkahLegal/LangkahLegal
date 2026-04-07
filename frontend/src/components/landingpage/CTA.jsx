import { Button } from "../ui";

export default function CTA({ onGetStarted }) {
  return (
    <section className="px-6 py-24 relative z-10">
      <div className="glass-card max-w-5xl mx-auto rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden bg-[#1f1d35]/50 border border-[#48455a] backdrop-blur-md">
        {/* Dekorasi Cahaya (Glow) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ada3ff]/10 rounded-full blur-[80px] -mr-32 -mt-32" />

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-urbanist font-bold text-[#e8e2fc] mb-6">
            Siap Melangkah Lebih Aman?
          </h2>

          <p className="text-[#aca8c1] mb-10 text-lg max-w-xl mx-auto">
            Gabung dengan ribuan pengguna yang telah mempercayakan urusan hukum
            mereka kepada LangkahLegal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onGetStarted}
              className="!w-full sm:!w-auto px-10 py-4"
            >
              Mulai Sekarang
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
