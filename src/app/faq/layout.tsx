import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about DFC — how to book a consultation, get a second opinion, join as a diaspora doctor, membership categories, and more.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Doctors Foundation For Care",
    description:
      "Common questions about booking consultations, second opinions, membership, and the DFC platform.",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
