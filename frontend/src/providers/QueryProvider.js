"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({ children }) {
  // Inisialisasi QueryClient dengan konfigurasi default
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap segar selama 1 menit (tidak fetch ulang otomatis dalam 1 menit)
            staleTime: 60 * 1000,
            // Menghindari fetch ulang otomatis saat user pindah tab/window browser
            refetchOnWindowFocus: false,
            // Percobaan fetch ulang jika gagal
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} /> {/* Tambahkan ini */}
    </QueryClientProvider>
  );
}
