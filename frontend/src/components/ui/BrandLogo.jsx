import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  className = "",
  iconSize = "w-8 h-8",
  textSize = "text-xl md:text-2xl",
  href = "/",
  variant = "default",
  showText = true,
}) {
  const isSidebar = variant === "sidebar";

  return (
    <Link
      href={href}
      aria-label="LangkahLegal"
      className={`flex items-center gap-2.5 group w-fit ${isSidebar ? "text-sidebar-text" : ""} ${className}`}
    >
      <div className={`relative transition-transform group-hover:scale-105 shrink-0 ${iconSize}`}>
        {isSidebar ? (
          <>
            <div className="relative w-full h-full brand-logo-light">
              <Image
                src="/images/icons.png"
                alt="LangkahLegal Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <svg
              viewBox="10 6 103 111"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="w-full h-full brand-logo-dark text-primary"
            >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M76.5,33.9 L46.4,34.0 L46.5,66.3 L43.2,68.8 L42.2,70.0 L41.4,71.7 L41.1,73.9 L41.2,85.6 L40.3,86.1 L28.3,89.4 L28.9,93.1 L34.6,91.3 L47.5,88.0 L52.0,86.3 L54.5,84.6 L55.1,83.4 L55.1,82.4 L54.4,81.0 L52.4,79.4 L47.0,76.1 L45.7,74.8 L45.2,73.8 L45.1,71.9 L45.6,70.7 L46.7,69.4 L49.1,67.7 L55.4,65.1 L66.2,62.6 L79.4,60.9 L90.5,60.4 L83.8,59.3 L76.5,58.9 Z M70.7,38.2 L72.0,39.0 L72.6,40.2 L72.6,59.1 L67.9,59.7 L67.7,59.4 L67.7,40.7 L68.1,39.3 L68.8,38.6 L69.7,38.2 Z M61.9,38.2 L62.9,38.6 L63.9,40.0 L64.0,60.2 L63.5,60.6 L59.2,61.5 L59.1,40.3 L59.8,38.9 L60.5,38.4 Z M53.3,38.2 L54.2,38.6 L55.2,40.1 L55.2,62.6 L50.6,64.4 L50.4,64.1 L50.4,40.5 L50.8,39.3 L51.6,38.5 Z M45.0,28.1 L46.5,31.7 L76.5,31.7 L77.0,30.0 L78.0,28.2 Z M28.8,29.4 L29.1,33.1 L30.6,35.9 L32.2,37.4 L33.9,38.3 L36.6,38.8 L39.2,38.4 L41.5,37.2 L42.6,36.1 L43.7,34.3 L44.2,31.4 L43.7,29.3 L43.0,28.2 L40.8,28.1 L41.3,29.5 L41.3,31.4 L40.3,33.7 L39.2,34.7 L37.8,35.3 L36.0,35.3 L34.5,34.7 L33.4,33.7 L32.6,32.4 L32.3,31.0 L32.4,29.4 L32.9,28.2 L34.2,26.7 L36.0,25.9 L87.1,25.9 L88.6,26.5 L89.7,27.5 L90.7,29.6 L90.5,32.3 L89.9,33.4 L88.2,34.9 L86.9,35.3 L85.2,35.3 L84.0,34.8 L82.8,33.8 L82.1,32.6 L81.7,31.1 L82.1,28.1 L79.9,28.2 L79.3,29.2 L78.8,31.1 L79.0,33.4 L80.5,36.2 L82.0,37.6 L85.1,38.7 L88.4,38.5 L91.3,37.0 L93.2,34.8 L93.9,33.2 L94.3,31.0 L94.0,28.1 L92.6,25.2 L90.0,22.9 L87.1,21.9 L35.9,21.9 L33.2,22.8 L30.8,24.8 L29.4,27.1 Z M38.6,16.0 L38.7,19.7 L84.4,19.6 L84.3,15.9 Z M33.7,9.9 L33.7,11.4 L34.2,12.5 L35.2,13.5 L36.4,13.9 L86.3,13.9 L88.0,13.4 L89.0,12.2 L89.3,11.2 L89.2,9.8 Z"
            />
            <path
              fill="currentColor"
              fillOpacity="0.65"
              fillRule="evenodd"
              d="M57.4,67.0 L54.9,68.1 L52.9,69.8 L52.4,70.9 L52.6,72.8 L55.1,75.3 L61.8,78.9 L64.3,80.6 L66.0,82.8 L66.2,83.7 L66.0,84.9 L65.2,86.3 L63.8,87.7 L61.1,89.6 L55.9,92.2 L48.2,95.6 L45.7,97.0 L42.4,99.4 L40.7,101.1 L39.5,103.2 L43.8,106.4 L45.7,103.0 L48.8,99.8 L52.6,97.2 L62.0,92.4 L65.5,90.2 L67.9,88.1 L69.2,86.0 L69.5,84.8 L69.4,83.1 L68.3,80.9 L67.1,79.7 L64.3,77.9 L56.6,74.2 L54.5,72.2 L54.1,71.3 L54.4,69.7 L55.6,68.3 Z M89.8,60.8 L80.1,62.0 L69.7,64.3 L63.9,66.4 L61.7,67.7 L60.3,69.4 L60.3,70.4 L60.7,71.1 L62.6,72.6 L73.4,76.6 L77.3,78.7 L80.1,81.2 L81.0,82.8 L81.4,84.3 L81.3,86.1 L80.9,87.4 L78.8,90.5 L76.6,92.6 L66.8,100.1 L65.2,101.7 L63.9,103.6 L63.4,105.1 L63.3,106.6 L64.1,109.1 L66.3,111.6 L68.9,113.2 L69.9,113.0 L76.8,108.5 L85.4,102.0 L90.7,96.7 L92.5,94.3 L94.1,91.2 L94.9,87.6 L94.6,85.0 L93.4,82.0 L91.2,79.3 L89.0,77.6 L86.1,76.0 L74.0,71.4 L72.4,70.4 L71.5,69.1 L71.6,68.1 L72.5,67.0 L76.2,64.9 L82.3,62.8 Z"
            />
          </svg>
          </>
        ) : (
          <Image
            src="/images/icons.png"
            alt="LangkahLegal Logo"
            fill
            sizes="48px"
            className="object-contain"
            priority
          />
        )}
      </div>
      {showText && (
        <span
          className={`font-bold tracking-tight font-headline ${isSidebar ? "text-sidebar-text" : "text-main"} ${textSize}`}
        >
          LangkahLegal
        </span>
      )}
    </Link>
  );
}