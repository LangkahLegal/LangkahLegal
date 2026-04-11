import { MaterialIcon } from "@/components/ui";
import Link from "next/link";

export function BrandLogo({ className = "", iconSize = "text-3xl", textSize = "text-2xl" }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group w-fit ${className}`}>
      <MaterialIcon
        name="gavel"
        className={`text-primary transition-transform group-hover:rotate-12 ${iconSize}`}
      />
      <span className={`font-bold tracking-tight text-main font-headline ${textSize}`}>
        LangkahLegal
      </span>
    </Link>
  );
}