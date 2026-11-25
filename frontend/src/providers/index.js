"use client";

import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { FeedbackProvider } from "./FeedbackProvider";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
