import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteJsonLd } from "@/components/seo/site-jsonld";
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

function safeMetadataBase(): URL {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

/** Avoid stale auth + caching quirks between middleware and `/api/auth/session`. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: { default: "Modempic", template: "%s | Modempic" },
  description: "Modafinil, peptides, skin care, and wellness products—clear labels, USD pricing, secure checkout.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("[RootLayout] auth() failed — continuing without session", e);
  }
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
        suppressHydrationWarning
      >
        <SiteJsonLd />
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
