import type { Metadata } from "next";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/layout/HeroSection";
import SearchBar from "@/components/layout/SearchBar";
import WhyChooseDFC from "@/components/layout/WhyChooseDFC";
import ERISection from "@/components/layout/ERISection";
import EventsSection from "@/components/layout/EventsSection";
import ProjectsSection from "@/components/layout/ProjectsSection";
import MediaSection from "@/components/layout/MediaSection";
import JoinDFCSection from "@/components/layout/JoinDFCSection";
import UserRedirect from "@/components/auth/UserRedirect";
import { MedicalWebPageJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "DFC | Doctors Foundation For Care — Nigerian Diaspora Medical Experts",
  description:
    "Turning brain drain into brain gain. Book consultations with Nigerian diaspora doctors, get expert second opinions, or find a specialist — all from world-trained physicians practising in the UK, US, and beyond.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "DFC | Doctors Foundation For Care — Nigerian Diaspora Medical Experts",
    description:
      "Book consultations with Nigerian diaspora doctors. Get expert second opinions. Find world-trained specialists.",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
        alt: "DFC — Doctors Foundation For Care. Nigerian diaspora doctors reconnecting with patients at home.",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <MedicalWebPageJsonLd
        name="DFC — Doctors Foundation For Care"
        description="Turning brain drain into brain gain. A global healthcare movement reconnecting Nigerian diaspora doctors with patients at home."
        url="https://dfcare.org"
      />
      <UserRedirect />
      <Topbar />
      <main className="flex-1">
        <HeroSection />
        <SearchBar />
        <WhyChooseDFC />
        <ERISection />
        <EventsSection />
        <ProjectsSection />
        <MediaSection />
        <JoinDFCSection />
      </main>
      <Footer />
    </>
  );
}
