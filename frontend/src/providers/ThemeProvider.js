"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(undefined); // Inisialisasi dengan undefined

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark-tech");
  const [mounted, setMounted] = useState(false);

  // 1. Sinkronisasi dengan localStorage saat mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("user-pref-theme") || "dark-tech";
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  // 2. Manipulasi class <html> saat tema berubah
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Bersihkan class tema lama
    root.classList.remove("theme-cyber-slate", "theme-white-modern");

    // Tambahkan class tema baru jika bukan default
    if (theme !== "dark-tech") {
      root.classList.add(theme);
    }

    localStorage.setItem("user-pref-theme", theme);
  }, [theme, mounted]);

  // REVISI: Provider harus selalu membungkus children
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* Gunakan visibility: hidden agar konten tidak 'flash' (FOUC) 
        tapi Context tetap tersedia untuk anak-anaknya.
      */}
      <div
        style={{
          visibility: mounted ? "visible" : "hidden",
          display: "contents", // Agar tidak merusak layout flex/grid parent-nya
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Cek apakah hook dipanggil di luar Provider
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
