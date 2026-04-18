"use client";

import QueryProvider from "./QueryProvider";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>


      {children}

    </QueryProvider>
  );
}
