import { Inter } from "next/font/google"; 
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}