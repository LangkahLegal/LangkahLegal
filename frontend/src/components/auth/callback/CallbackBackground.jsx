export default function CallbackBackground() {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full" />
    </div>
  );
}
