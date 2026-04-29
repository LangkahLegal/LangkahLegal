"use client";

import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider"; // Import ini

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
