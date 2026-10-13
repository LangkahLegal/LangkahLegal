import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  className = "",
  iconSize = "w-8 h-8",
  textSize = "text-xl md:text-2xl",
  href = "/",
}) {
  return (
    <Link href={href} className={`flex items-center gap-3 group w-fit ${className}`}>
      <div className={`relative transition-transform group-hover:scale-105 shrink-0 ${iconSize}`}>
        <Image
          src="/images/icons.png"
          alt="LangkahLegal Logo"
          fill
          sizes="48px"
          className="object-contain"
          priority
        />
      </div>
      <span className={`font-bold tracking-tight text-main font-headline ${textSize}`}>
        LangkahLegal
      </span>
    </Link>
  );
}