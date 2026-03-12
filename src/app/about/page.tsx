import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import About from "@/components/about/about";
import CTA from "@/components/about/cta";
export default function AboutPage() {

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-[#F8F9FB]">
        <About />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
