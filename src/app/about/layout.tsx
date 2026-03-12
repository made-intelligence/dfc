import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about the Doctors Foundation For Care (DFC) — a global healthcare movement reconnecting Nigerian diaspora doctors with patients at home. CAC RN: 7723649.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About DFC — Doctors Foundation For Care",
    description:
      "A global healthcare movement turning brain drain into brain gain. Nigerian diaspora physicians delivering world-class care to patients at home.",
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "About DFC" }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
