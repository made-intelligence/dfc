"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { data } from "./faqData";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-40 pb-16">
          <p className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Support</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-white/60 mt-4 max-w-xl">
            Find answers to common questions about DFC services, membership, and consultations.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="relative -mt-6 z-10 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-[#0A6E75]" />
              <h2 className="text-lg font-semibold text-[#0D1F3C]">{data.length} Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {data.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold text-[#0D1F3C] text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 text-base leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
