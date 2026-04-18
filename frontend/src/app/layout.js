import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "LangkahLegal",
  description: "Solusi Konsultasi Hukum Terpercaya",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Cukup panggil AppProviders sekali untuk membungkus semuanya */}
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}