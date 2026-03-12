import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dfcare.org"),
  title: {
    default: "DFC | Doctors Foundation For Care — Nigerian Diaspora Medical Experts",
    template: "%s | DFC — Doctors Foundation For Care",
  },
  description:
    "Turning brain drain into brain gain. DFC connects Nigerian diaspora doctors with patients at home — book consultations, get second opinions, and access specialist care from world-trained physicians.",
  keywords: [
    "Nigerian doctors abroad",
    "diaspora doctors Nigeria",
    "second opinion Nigeria",
    "Nigerian specialist consultation",
    "DFC doctors",
    "Doctors Foundation for Care",
    "telemedicine Nigeria",
    "book Nigerian doctor",
    "medical second opinion Africa",
    "diaspora healthcare",
    "Nigerian physician network",
    "specialist referral Nigeria",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DFC — Doctors Foundation For Care",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Doctors Foundation For Care (DFC)",
    title: "DFC | Doctors Foundation For Care — Nigerian Diaspora Medical Experts",
    description:
      "Turning brain drain into brain gain. Connect with Nigerian diaspora doctors for consultations, second opinions, and specialist care.",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Doctors Foundation For Care — Connecting diaspora physicians with patients in Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DFC | Doctors Foundation For Care",
    description:
      "Turning brain drain into brain gain. Connect with Nigerian diaspora doctors for consultations, second opinions, and specialist care.",
    images: ["/hero.jpg"],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1F3C",
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
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        <OrganizationJsonLd />
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
