import type { Metadata, Viewport } from "next";
import MobileRuntime from "@/components/MobileRuntime";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viwanda Prime Mobile",
  description:
    "Tanzania's industrial marketplace for technicians, machinery, materials and labour.",
  applicationName: "Viwanda Prime",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Viwanda Prime",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#102421",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Scroll-reveal starts hidden; without JS it must never stay hidden. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="mobile-web-app">
        {children}
        <MobileRuntime />
      </body>
    </html>
  );
}
