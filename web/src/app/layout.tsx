import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteJsonLd } from "@/components/seo/site-jsonld";
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
const SITE_DESCRIPTION =
  "Online pharmacy with modafinil, tretinoin, sildenafil, gabapentin, pregabalin, and related products. Clear labels, USD pricing, discreet packaging, and secure card or crypto checkout.";

function safeMetadataBase(): URL {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(),
  title: { default: "Modempic", template: "%s | Modempic" },
  description: SITE_DESCRIPTION,
  applicationName: "Modempic",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Modempic",
    locale: "en_US",
    title: "Modempic",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Modempic",
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <SiteJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
