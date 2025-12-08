import type { Metadata } from "next";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/layout/HeroSection";
import ImpactStats from "@/components/layout/ImpactStats";
import WhyChooseDFC from "@/components/layout/WhyChooseDFC";
import JoinDFCSection from "@/components/layout/JoinDFCSection";
import UserRedirect from "@/components/auth/UserRedirect";

export const metadata: Metadata = {
  title: "DFC | Doctors Foundation For Care - World-Class Healthcare in Nigeria",
  description:
    "Connect with top diaspora doctors visiting Nigeria. Book consultations, surgeries, and get world-class medical care with DFC.",
  openGraph: {
    title: "DFC | Doctors Foundation For Care",
    description: "Bridging the gap between Nigerians and global medical expertise.",
    images: ["/hero.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
      <UserRedirect />
      <Topbar />
      <main className="flex-1">
        <div className="font-display bg-background-light text-text-light dark:bg-background-dark dark:text-text-dark">
          <HeroSection />
          <ImpactStats />
          <WhyChooseDFC />
          <JoinDFCSection />
        </div>
      </main>

      <Footer />
    </>
  );
}
