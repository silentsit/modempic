import type { Metadata, Viewport } from "next";
import { Merriweather, Open_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteJsonLd } from "@/components/seo/site-jsonld";
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
  weight: ["400", "700"],
  display: "swap",
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

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
