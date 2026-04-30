import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { auth } from "@/auth";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

/** Avoid stale auth + caching quirks between middleware and `/api/auth/session`. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Modempic", template: "%s | Modempic" },
  description: "Supplements, vitamins, and herbal wellness—clear labels, USD pricing, secure checkout.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
