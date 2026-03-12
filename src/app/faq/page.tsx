import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import FAQ from "@/components/about/faq";


export default function FaqPage() {

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-white">
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
