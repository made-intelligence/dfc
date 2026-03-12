"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const partners = [
  {
    name: "MANSAG UK",
    fullName: "Medical Association of Nigerian Specialists and General Practitioners, UK",
  },
  {
    name: "ANPA",
    fullName: "Association of Nigerian Physicians in the Americas",
  },
  {
    name: "NAFDAC",
    fullName: "National Agency for Food and Drug Administration and Control",
  },
  {
    name: "NMA",
    fullName: "Nigerian Medical Association",
  },
  {
    name: "MDCN",
    fullName: "Medical and Dental Council of Nigeria",
  },
  {
    name: "NIDCOM",
    fullName: "Nigerians in Diaspora Commission",
  },
];

export default function PartnersSection() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="text-xs font-semibold tracking-wider text-[#0A4A50] uppercase mb-3 block">
            Collaborations
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
            Our partners & affiliates
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            We work alongside leading medical associations, regulatory bodies, and
            diaspora organisations to deliver lasting impact.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="group bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col items-center justify-center text-center hover:border-[#0A4A50]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[120px]"
            >
              <span className="text-lg sm:text-xl font-bold text-[#0D1F3C] group-hover:text-[#0A4A50] transition-colors">
                {partner.name}
              </span>
              <span className="mt-2 text-[11px] sm:text-xs text-gray-500 leading-snug line-clamp-2">
                {partner.fullName}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 text-base font-semibold text-[#0A4A50] hover:text-[#0D1F3C] transition-colors"
          >
            Become a partner
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
