import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dfcare.org"),
  title: "DFC | Doctors Foundation For Care",
  description:
    "a global healthcare movement and digital platform created to bridge the gap between Nigerians and the wealth of medical expertise across the world",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DFC App",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "DFC App",
    title: "DFC | Doctors Foundation For Care",
    description:
      "A global healthcare movement and digital platform created to bridge the gap between Nigerians and the wealth of medical expertise across the world",
  },
  twitter: {
    card: "summary",
    title: "DFC | Doctors Foundation For Care",
    description:
      "A global healthcare movement and digital platform created to bridge the gap between Nigerians and the wealth of medical expertise across the world",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DFC App" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
