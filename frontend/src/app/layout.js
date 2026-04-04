import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Pindahkan konfigurasi viewport ke sini
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Opsi tambahan untuk mobile:
  viewportFit: "cover", // Bagus jika HP punya "notch" (poni)
};

export const metadata = {
  title: "LangkahLegal",
  description: "Solusi Konsultasi Hukum Terpercaya",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Google Fonts via CDN */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600&family=Urbanist:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>

      {/* 2. Tambahkan class font ke body agar font default-nya teraplikasikan */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
