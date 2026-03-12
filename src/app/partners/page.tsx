import type { Metadata } from "next";
import Image from "next/image";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hospital & Institutional Partners",
  description:
    "Partner with DFC to host visiting Nigerian diaspora specialists, run outreach programmes, and strengthen healthcare delivery across Nigeria.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Partner with DFC — Doctors Foundation For Care",
    description:
      "Host visiting diaspora specialists, run outreach programmes, and transform healthcare delivery in Nigeria.",
    images: [{ url: "/partners-hero.jpg", width: 1200, height: 630, alt: "DFC Hospital Partners" }],
  },
};

export default function PartnersPage() {
  return (
    <>
      <Topbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0D1F3C] overflow-hidden min-h-[420px] lg:min-h-[480px]">
          <Image
            src="/partners-hero.jpg"
            alt="Modern hospital building"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[#0D1F3C]/60" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-16 lg:pt-40 lg:pb-24 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Partner with DFC
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Work with the diaspora to strengthen healthcare delivery in
              Nigeria. We partner with hospitals, health organisations, and
              government agencies.
            </p>
          </div>
        </section>

        {/* Why partner */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 sm:px-8">
            <h2 className="text-2xl font-bold text-[#0D1F3C] mb-6">
              Why partner with DFC
            </h2>
            <div className="space-y-4 text-base text-gray-700 leading-relaxed">
              <p>
                DFC members are Nigerian-trained physicians who now hold
                specialist positions in the UK, US, Canada, Germany, Ireland, and
                beyond. They bring international training, advanced techniques,
                and a deep connection to Nigeria.
              </p>
              <p>
                Through structured partnerships, your institution can access this
                expertise for clinical sessions, surgical camps, training
                programmes, and policy work without the complexity of individual
                recruitment.
              </p>
            </div>
          </div>
        </section>

        {/* Partnership types */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6 sm:px-8">
            <h2 className="text-2xl font-bold text-[#0D1F3C] mb-8">
              How we work together
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Host visiting specialists",
                  text: "Provide facilities and patient access for DFC members during their Nigeria visits. We handle scheduling and coordination.",
                },
                {
                  title: "Outreach programmes",
                  text: "Co-organise free clinics, surgical camps, and screening programmes in your community or facility.",
                },
                {
                  title: "Training and mentorship",
                  text: "Partner on hands-on training for your medical staff, residents, and junior doctors led by diaspora specialists.",
                },
                {
                  title: "Policy collaboration",
                  text: "Work with DFC technical working groups on health policy, emergency response frameworks, and system-level improvements.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <h3 className="font-semibold text-[#0D1F3C] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0D1F3C] py-16">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Become a partner
            </h2>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-lg mx-auto">
              Interested institutions can reach out to the DFC secretariat. We
              will discuss how we can work together based on your needs and
              location.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Contact the secretariat
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
