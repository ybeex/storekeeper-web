"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "./ui";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: {
      // Offline-first: run the first attempt even without a connection (fetch fails fast and the offline fallbacks take over),
      // and never pause mutations, because routine movements queue themselves on the device.
      queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true, networkMode: "offlineFirst" },
      mutations: { networkMode: "always" },
    } }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
    </QueryClientProvider>
  );
}
