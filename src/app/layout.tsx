import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top";
import { GlobalCartModals } from "@/components/layout/global-cart-modals";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Arcfield — Premium Workspace Gear & Studio Equipment",
  description:
    "Engineered mechanical interfaces, ergonomics, studio audio equipment, and workspace accessories crafted with uncompromising quality.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <Providers>
          {children}
          <GlobalCartModals />
          <MobileBottomNav />
          <OfflineIndicator />
          <ScrollToTopButton />
        </Providers>
      </body>
    </html>
  );
}
