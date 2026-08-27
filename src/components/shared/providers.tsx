"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/components/auth-context";
import { I18nProvider } from "@/lib/i18n/context";
import { SyncProvider } from "@/lib/offline/sync-context";

interface ProvidersProps {
  children: ReactNode;
  initialUser?: import("@/types").User | null;
}

export function Providers({ children, initialUser = null }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={initialUser}>
          <SyncProvider>
            <I18nProvider>{children}</I18nProvider>
          </SyncProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
