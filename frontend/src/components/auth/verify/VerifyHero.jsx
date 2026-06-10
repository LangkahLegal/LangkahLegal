import { MaterialIcon } from "@/components/ui/Icons";

export default function VerifyHero() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Banner */}
      <div className="w-full relative mb-10 overflow-hidden rounded-3xl h-48 flex items-center justify-center border border-surface shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.2),transparent_70%)]" />

        <div className="absolute inset-0 bg-gradient-to-br from-card via-surface to-card opacity-95 transition-colors duration-500" />

        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary rounded-full blur-[80px] opacity-10" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-light rounded-full blur-[80px] opacity-10" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-light blur-2xl opacity-40 rounded-full scale-75" />
            <MaterialIcon
              name="mark_email_unread"
              className="relative z-20 text-primary-light"
              style={{
                fontSize: "80px",
                filter:
                  "drop-shadow(0 0 15px rgba(var(--primary-light-rgb), 0.6))",
              }}
            />
          </div>
          <div className="mt-2 w-12 h-1 bg-gradient-to-r from-transparent via-primary-light/30 to-transparent rounded-full" />
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center space-y-3 mb-10">
        <h2
          className="text-3xl font-bold tracking-tight text-main transition-colors duration-500"
          style={{ fontFamily: "Urbanist, sans-serif" }}
        >
          LangkahLegal
        </h2>
        <p className="text-muted text-base leading-relaxed max-w-[280px] mx-auto transition-colors duration-500">
          Masukkan 6 digit kode yang telah kami kirimkan ke email Anda
        </p>
      </div>
    </div>
  );
}
