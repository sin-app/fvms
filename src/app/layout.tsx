import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { ErrorOverlay } from "@/components/shared/error-overlay";
import { DebugPanel } from "@/components/shared/debug-panel";
import { getCurrentUserAction } from "@/features/auth/actions/user-actions";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FVMS - Field Visit Management System",
  description: "Kelola jadwal kunjungan lapangan secara profesional",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FVMS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-maskable-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#065f46" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Baca user di server (cookie dibaca langsung dari request — andal di TWA/
  // WebView, tidak bergantung pada client storage/Service Worker). Hasilnya
  // di-seed ke AuthProvider agar dashboard langsung render tanpa menunggu
  // client session yang bisa menggantung.
  let initialUser = null;
  try {
    initialUser = await getCurrentUserAction();
  } catch {
    initialUser = null;
  }

  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ErrorOverlay />
        <Providers initialUser={initialUser}>
          {children}
          <DebugPanel />
        </Providers>
      </body>
    </html>
  );
}
