import GlobalAnalyticsEvents from "@/components/analytics/GlobalAnalyticsEvents";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-Z8LR7SMZNY";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ToolSpotAI — Free Online Calculators & Tools",
    template: "%s | ToolSpotAI",
  },
  description:
    "Free calculators and tools for finance, health, math, and daily tasks. No signup—instant, private results.",
  keywords: [
    "free online calculator",
    "online tools",
    "calculator",
    "free tools",
    "math calculator",
    "finance calculator",
    "health calculator",
    "bmi calculator",
    "mortgage calculator",
    "income tax calculator",
  ],
  authors: [{ name: "ToolSpotAI", url: SITE_URL }],
  creator: "ToolSpotAI",
  publisher: "ToolSpotAI",
  openGraph: {
    title: "ToolSpotAI — Free Online Calculators & Tools",
    description:
      "Free calculators for finance, health, math, and daily tasks. No signup—instant, private results.",
    type: "website",
    url: SITE_URL,
    siteName: "ToolSpotAI",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 512,
        height: 512,
        alt: "ToolSpotAI logo",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolSpotAI — Free Online Calculators & Tools",
    description:
      "Free calculators and tools. No signup—instant, private results.",
    creator: "@toolspotai",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.frankfurter.app" />
      </head>
      <body className="flex min-h-full flex-col font-sans antialiased">
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        ) : null}
        <GlobalAnalyticsEvents />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
