"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

const ThemeContext = createContext(undefined);

// REFACTOR 1: Ubah default theme ke light mode
const DEFAULT_THEME = "theme-white-modern";
const THEME_CLASSES = ["dark-tech", "theme-cyber-slate", "theme-white-modern"];

const listeners = new Set();

// REFACTOR 3: Logika validasi jadi lebih ringkas
const isValidTheme = (value) => THEME_CLASSES.includes(value);

const getStoredTheme = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem("user-pref-theme");
  return isValidTheme(stored) ? stored : DEFAULT_THEME;
};

const applyThemeClass = (theme) => {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;

  // Bersihkan semua class tema lama yang mungkin menempel
  root.classList.remove(...THEME_CLASSES);

  root.classList.add(theme);
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

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeValue }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
