"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

const ThemeContext = createContext(undefined); // Inisialisasi dengan undefined
const DEFAULT_THEME = "dark-tech";
const THEME_CLASSES = ["theme-cyber-slate", "theme-white-modern"];
const listeners = new Set();

const isValidTheme = (value) =>
  value === DEFAULT_THEME || THEME_CLASSES.includes(value);

const getStoredTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem("user-pref-theme");
  return isValidTheme(stored) ? stored : DEFAULT_THEME;
};

const applyThemeClass = (theme) => {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;

  // Bersihkan class tema lama
  root.classList.remove(...THEME_CLASSES);

  // Tambahkan class tema baru jika bukan default
  if (theme !== DEFAULT_THEME) {
    root.classList.add(theme);
  }
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const setThemeValue = (nextTheme) => {
  const normalized = isValidTheme(nextTheme) ? nextTheme : DEFAULT_THEME;
  if (typeof window !== "undefined") {
    localStorage.setItem("user-pref-theme", normalized);
  }
  notify();
};

const getSnapshot = () => getStoredTheme();
const getServerSnapshot = () => DEFAULT_THEME;

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 1. Manipulasi class <html> saat tema berubah
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // REVISI: Provider harus selalu membungkus children
  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeValue }}>
      {children}
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
