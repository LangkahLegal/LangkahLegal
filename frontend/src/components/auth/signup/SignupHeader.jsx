export default function SignupHeader({ title, subtitle }) {
  return (
    <header className="mb-6 text-center space-y-3">

      <h1 className="font-headline text-[2rem] md:text-4xl font-extrabold tracking-tighter text-main leading-tight">
        {title}
      </h1>
      <p className="text-muted text-[0.9375rem] font-medium px-4 leading-relaxed">
        {subtitle}
      </p>
    </header>
  );
}
