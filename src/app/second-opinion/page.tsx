import { Metadata } from "next";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { SecondOpinionLanding } from "@/components/second-opinion/SecondOpinionLanding";

export const metadata: Metadata = {
  title: "Medical Second Opinion — Expert Review by Diaspora Specialists",
  description:
    "Get an independent medical second opinion from world-trained Nigerian diaspora specialists. Written report within 72 hours. Standard, complex, and oncology tiers. No travel required.",
  alternates: { canonical: "/second-opinion" },
  openGraph: {
    title: "Medical Second Opinion — DFC Diaspora Specialists",
    description:
      "Independent medical review from diaspora-trained Nigerian specialists. Written report within 72 hours. No travel, no waiting list.",
    type: "website",
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "DFC Second Opinion Service" }],
  },
  keywords: [
    "medical second opinion Nigeria",
    "second opinion diaspora doctor",
    "independent medical review",
    "Nigerian specialist opinion",
    "oncology second opinion Nigeria",
  ],
};

export default function SecondOpinionPage() {
  return (
    <>
      <Topbar />
      <SecondOpinionLanding />
      <Footer />
    </>
  );
}
