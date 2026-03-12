"use client";

import Link from "next/link";
import { ArrowRight, Stethoscope, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { data } from "./faqData";

export default function CTA() {
  return (
    <>
      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#0A6E75]/20 blur-[100px] -top-32 -right-20" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-white/[0.03] blur-[60px] bottom-0 left-[10%]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Join the Movement
          </h2>
          <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-xl mx-auto">
            Be part of the generation turning brain drain into brain gain. DFC
            membership is open to Nigerian physicians abroad, Nigeria-based
            consultants, and physicians in training.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/join"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-50 hover:shadow-lg transition-all duration-200 shadow-md"
            >
              <Stethoscope className="w-4 h-4" />
              Apply for Membership
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/second-opinion"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium text-base hover:bg-white/20 transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              Request a Second Opinion
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 bg-[#F8F9FB]">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-[#0D1F3C]">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {data.slice(0, 6).map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-[#0D1F3C] font-medium text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-[#0A6E75] font-semibold hover:underline"
            >
              View all FAQs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
