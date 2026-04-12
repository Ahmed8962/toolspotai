import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        source: "/(.*)\\.(js|css|woff2|woff|ttf|svg|png|jpg|jpeg|webp|avif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/tools/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.toolspotai.com" }],
        destination: "https://toolspotai.com/:path*",
        permanent: true,
      },
      { source: "/bmi-calculator", destination: "/tools/bmi-calculator", permanent: true },
      { source: "/mortgage-calculator", destination: "/tools/mortgage-calculator", permanent: true },
      { source: "/income-tax-calculator", destination: "/tools/income-tax-calculator", permanent: true },
      { source: "/calorie-calculator", destination: "/tools/calorie-tdee-calculator", permanent: true },
      { source: "/currency-converter", destination: "/tools/currency-converter", permanent: true },
      { source: "/pregnancy-calculator", destination: "/tools/pregnancy-calculator", permanent: true },
      { source: "/gpa-calculator", destination: "/tools/gpa-calculator", permanent: true },
      { source: "/loan-calculator", destination: "/tools/loan-calculator", permanent: true },
      { source: "/percentage-calculator", destination: "/tools/percentage-calculator", permanent: true },
      { source: "/bmi", destination: "/tools/bmi-calculator", permanent: true },
      { source: "/emi-calculator", destination: "/tools/emi-calculator", permanent: true },
      { source: "/vat-calculator", destination: "/tools/vat-sales-tax-calculator", permanent: true },
      { source: "/retirement-calculator", destination: "/tools/retirement-calculator", permanent: true },
      { source: "/salary-calculator", destination: "/tools/salary-calculator", permanent: true },
      { source: "/ovulation-calculator", destination: "/tools/ovulation-calculator", permanent: true },
      { source: "/period-calculator", destination: "/tools/period-calculator", permanent: true },
      { source: "/bmr-calculator", destination: "/tools/bmr-calculator", permanent: true },
      { source: "/typing-test", destination: "/tools/typing-speed-test", permanent: true },
      { source: "/json-formatter", destination: "/tools/json-formatter", permanent: true },
      { source: "/password-generator", destination: "/tools/password-generator", permanent: true },
      { source: "/auto-loan-calculator", destination: "/tools/auto-loan-calculator", permanent: true },
      { source: "/car-loan-calculator", destination: "/tools/auto-loan-calculator", permanent: true },
      { source: "/paycheck-calculator", destination: "/tools/paycheck-calculator", permanent: true },
      { source: "/body-fat-calculator", destination: "/tools/body-fat-calculator", permanent: true },
      { source: "/macro-calculator", destination: "/tools/macro-calculator", permanent: true },
      { source: "/inflation-calculator", destination: "/tools/inflation-calculator", permanent: true },
      { source: "/baby-names", destination: "/tools/baby-name-generator", permanent: true },
      { source: "/sip-calculator", destination: "/tools/sip-calculator", permanent: true },
      { source: "/image-compressor", destination: "/tools/image-compressor", permanent: true },
      { source: "/markdown-editor", destination: "/tools/markdown-editor", permanent: true },
      { source: "/blood-pressure-calculator", destination: "/tools/blood-pressure-calculator", permanent: true },
      {
        source: "/tools/ai-content-humanizer",
        destination: "/tools/writing-calculators",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
