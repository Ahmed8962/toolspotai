import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { SITE_URL } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

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
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolSpotAI — Free Online Calculators & Tools",
    description:
      "Free calculators and tools. No signup—instant, private results.",
    creator: "@toolspotai",
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
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
