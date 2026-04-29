import { Button } from "../ui";

export default function Hero({ onGetStarted, onLearnMore }) {
  return (
    <section className="relative px-6 py-20 lg:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
      <div className="glow-top-left-purple" />
      <div className="glow-bottom-right-secondary" />

      <div className="relative z-10 space-y-8 max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-main leading-[1.1] tracking-tight">
          Solusi Hukum{" "}
          <span
            style={{
              background:
                "linear-gradient(to right, var(--primary-light), var(--primary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Digital & Terpercaya
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          Akses bantuan hukum profesional dengan satu sentuhan. Cepat,
          transparan, dan terjangkau untuk kebutuhan personal maupun bisnis
          Anda.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            onClick={onGetStarted}
            className="!w-full sm:!w-auto px-10 py-4 text-lg"
          >
            Coba Sekarang
          </Button>
          <Button
            variant="outline"
            onClick={onLearnMore}
            className="!w-full sm:!w-auto px-10 py-4 text-lg"
          >
            Pelajari Layanan
          </Button>
        </div>
      </div>

      <div className="mt-20 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-primary-light/10 bg-input p-2 relative z-10">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEvueWKSnGkuhnVc-MbIOKmCpZ-4RcnjrRD9ObtzCKnRpLMnIjKW089uwG7-PIWBot5tZHBTGhDZuCu2j1qZ5aKireqEUDaDvGRq6SrK8lYIuzpoToD7aDOWPC-d6_eTb9KsFfBklx1bH6-qfVJN3usA8XYUsgQ1DM8Gv9yH1IPICTOIgR1Isd62iqwJJH_ks0cLit7eZf72RJGn4BNC9xDTfc6LUfSvryO1Qd3_tsx1qtel3DVl57bcw1-eTFITzlvNxTYfty4yKg"
          alt="Legal workspace"
          className="w-full h-[300px] md:h-[500px] object-cover rounded-2xl"
        />
      </div>
    </section>
  );
}
