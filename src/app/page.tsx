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

export const metadata: Metadata = {
  title: "DFC | Doctors Foundation For Care",
  description:
    "Turning brain drain into brain gain. A global healthcare movement reconnecting Nigerian diaspora doctors with patients at home. Find a specialist, get a second opinion, or join DFC.",
  openGraph: {
    title: "DFC | Doctors Foundation For Care",
    description:
      "Turning brain drain into brain gain. Reconnecting Nigerian diaspora doctors with patients at home.",
    images: ["/hero.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
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
