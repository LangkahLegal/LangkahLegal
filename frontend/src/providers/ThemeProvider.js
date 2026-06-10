"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

const ThemeContext = createContext(undefined);

const DEFAULT_THEME = "theme-white-modern";
const THEME_CLASSES = ["dark-tech", "theme-cyber-slate", "theme-white-modern"];

const listeners = new Set();

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

  // Update Favicon Color dynamically
  const svgColor = theme === "theme-white-modern" ? "%232d1e17" : "%236f59fe";
  const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="${svgColor}"><path d="M160-120v-60h480v60H160Zm222-212L160-554l70-72 224 222-72 72Zm254-254L414-810l72-70 222 222-72 72Zm202 426L302-696l42-42 536 536-42 42Z"/></svg>`;
  
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = `data:image/svg+xml;utf8,${svgFavicon}`;
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
