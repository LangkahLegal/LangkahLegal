"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui";
import { getStoredAccessToken, getStoredRole } from "@/lib/authStorage";

const NAV_LINKS = [
  { label: "Home", href: "#hero", sectionId: "hero" },
  { label: "Services", href: "#features", sectionId: "features" },
  { label: "About", href: "#about", sectionId: "about" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState({ isLoggedIn: false, role: null });
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const checkSession = () => {
      const token = getStoredAccessToken();
      const role = getStoredRole();
      setSession({ isLoggedIn: Boolean(token), role });
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    NAV_LINKS.forEach((link) => {
      const element = document.getElementById(link.sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleCtaClick = () => {
    if (!session.isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (session.role === "admin") {
      router.push("/dashboard/admin");
      return;
    }
    if (session.role === "konsultan" || session.role === "consultant") {
      router.push("/dashboard/consultant");
      return;
    }
    if (session.role === "client") {
      router.push("/dashboard/client");
      return;
    }
    router.push("/auth/role");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-bg/80 backdrop-blur-xl border-b border-surface transition-colors duration-500">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform group-hover:scale-105">
              <Image
                src="/images/icons.png"
                alt="LangkahLegal Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl md:text-2xl font-headline font-bold text-main tracking-tight">
              LangkahLegal
            </span>
          </Link>
        </div>

        <div className="hidden md:flex justify-center items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.sectionId;
            return (
              <a
                key={link.label}
                href={pathname === "/" ? link.href : `/${link.href}`}
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    const el = document.getElementById(link.sectionId);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                      setActiveSection(link.sectionId);
                    }
                  }
                }}
                className={`font-headline transition-colors duration-300 ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted hover:text-primary-light"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="flex-1 flex justify-end items-center">
          <Button
            onClick={handleCtaClick}
            className="!rounded-lg md:!rounded-xl !w-auto !py-2 !px-4 md:!py-2.5 md:!px-6 text-sm md:text-base font-bold whitespace-nowrap shadow-md hover:scale-105 transition-transform"
          >
            {session.isLoggedIn ? "Dashboard" : "Mulai"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
