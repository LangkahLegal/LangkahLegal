"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ll_sidebar_collapsed";
const listeners = new Set();

const getStoredCollapsed = () => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false; // storage diblokir (mode privat): sidebar tetap terbuka
  }
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY) listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
};

export const setSidebarCollapsed = (next) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // abaikan: state hanya tidak tersimpan antar sesi
    }
  }
  notify();
};

export const toggleSidebarCollapsed = () => {
  setSidebarCollapsed(!getStoredCollapsed());
};

export function useSidebarCollapsed() {
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getStoredCollapsed,
    () => false,
  );
  return {
    isCollapsed,
    setCollapsed: setSidebarCollapsed,
    toggle: toggleSidebarCollapsed,
  };
}

