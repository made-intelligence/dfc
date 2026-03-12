import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using the Doctors Foundation for Care platform. Covers consultations, second opinions, membership, and platform use.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
