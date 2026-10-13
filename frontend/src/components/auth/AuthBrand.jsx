import Image from "next/image";
import Link from "next/link";

export default function AuthBrand() {
  return (
    <Link
      href="/"
      className="relative z-10 mb-6 flex w-fit items-center gap-2.5 font-headline text-xl font-bold tracking-tight text-primary transition-colors hover:text-primary-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:absolute md:left-8 md:top-8 md:mb-0"
    >
      <Image
        src="/images/icons.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
      />
      <span>LangkahLegal</span>
    </Link>
  );
}
