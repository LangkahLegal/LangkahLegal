export default function OtpInputGroup({
  code,
  inputs,
  onPaste,
  onChange,
  onKeyDown,
}) {
  return (
    <div className="grid grid-cols-6 gap-3 mb-12 w-full" onPaste={onPaste}>
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          placeholder="-"
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          className="w-full aspect-square text-center bg-[#1f1d35] border-2 border-white/10 rounded-xl text-2xl font-extrabold text-main outline-none transition-all duration-200 focus:border-primary-light focus:ring-1 focus:ring-primary-light/20 placeholder:text-muted/20"
        />
      ))}
    </div>
  );
}
