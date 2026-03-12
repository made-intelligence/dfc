import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Specialist",
  description:
    "Browse verified Nigerian diaspora specialists across cardiology, oncology, neurology, surgery, and more. All DFC doctors are credentialed and practising internationally.",
  alternates: { canonical: "/specialists" },
  openGraph: {
    title: "Find a Specialist — Doctors Foundation For Care",
    description:
      "Browse verified diaspora-trained Nigerian specialists. Credentialed doctors across every major specialty.",
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "DFC Specialists" }],
  },
};

export default function SpecialistsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
