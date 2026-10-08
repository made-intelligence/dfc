import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about the Doctors Foundation For Care (DFC) — a global healthcare movement reconnecting Nigerian diaspora doctors with patients at home. CAC RN: 7723649.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About DFC — Doctors Foundation For Care",
    description:
      "A professional body of Nigerian physicians practising in Nigeria and internationally, working to connect patients with the right specialist.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "About DFC" }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
