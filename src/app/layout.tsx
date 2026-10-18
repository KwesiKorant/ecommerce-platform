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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
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
