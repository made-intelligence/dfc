import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import FAQ from "@/components/about/faq";
import { FAQJsonLd } from "@/components/seo/JsonLd";
import { data as faqData } from "@/components/about/faqData";

export default function FaqPage() {
  return (
    <>
      <FAQJsonLd faqs={faqData} />
      <Topbar />
      <main className="min-h-screen bg-[#F8F9FB]">
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
