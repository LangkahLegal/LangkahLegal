"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, MaterialIcon, BrandLogo } from "../ui";

const NAV_LINKS = [
  { label: "Home", href: "/", active: true },
  { label: "Services", href: "#features", active: false },
  { label: "About", href: "#about", active: false },
];

export default function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState({ isLoggedIn: false, role: null });

  useEffect(() => {
    const checkSession = () => {
      const matchToken = document.cookie.match(/(^|; )ll_token=([^;]*)/);
      const matchRole = document.cookie.match(/(^|; )ll_role=([^;]*)/);
      const token = localStorage.getItem("token") || matchToken?.[2];
      const role = matchRole ? decodeURIComponent(matchRole[2]) : null;

      setSession({ isLoggedIn: Boolean(token), role });
    };

    checkSession();
  }, []);

  const handleCtaClick = () => {
    if (!session.isLoggedIn) {
      router.push("/auth/login");
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
    <nav className="fixed top-0 w-full z-50 bg-dark/70 backdrop-blur-xl border-b border-muted/30">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <BrandLogo iconSize="text-3xl" textSize="text-2xl" />

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`font-headline transition-colors duration-300 ${
                link.active
                  ? "text-primary-light font-bold"
                  : "text-muted hover:text-primary-light"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Button: Login / Get Started */}
        <div className="flex items-center">
          <Button
            onClick={handleCtaClick}
            className="!w-auto !py-2.5 !px-6 text-sm font-bold"
          >
            {session.isLoggedIn ? "Dashboard" : "Get Started"}
          </Button>
        </div>
      </div>
    </nav>
  );
}