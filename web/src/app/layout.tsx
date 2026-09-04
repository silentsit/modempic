import type { Metadata, Viewport } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteJsonLd } from "@/components/seo/site-jsonld";
import { env } from "@/lib/env";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

const siteUrl = getSiteUrl();
const SITE_DESCRIPTION =
  "Hard-to-find medicines at guaranteed best prices. Clear labels, pack-size pricing, and secure card or crypto checkout.";

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
  ...(env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  openGraph: {
    type: "website",
    siteName: "Modempic",
    locale: "en_US",
    title: "Modempic",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modempic",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/modempic-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${openSans.variable} ${merriweather.variable} ${openSans.className} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <SiteJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
