import { Metadata } from "next";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { SecondOpinionLanding } from "@/components/second-opinion/SecondOpinionLanding";

export const metadata: Metadata = {
  title: "Second Opinion | Doctors Foundation for Care",
  description:
    "Get an independent medical review from diaspora-trained Nigerian specialists. Written report within 72 hours. No travel, no waiting list.",
  openGraph: {
    title: "Second Opinion | Doctors Foundation for Care",
    description:
      "Get an independent medical review from diaspora-trained Nigerian specialists. Written report within 72 hours.",
    type: "website",
  },
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
