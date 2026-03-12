"use client";

import Link from "next/link";
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
      <section className="bg-[#0D1F3C] py-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Join the movement
          </h2>
          <p className="mt-4 text-base text-white/70 leading-relaxed max-w-lg mx-auto">
            Be part of the generation turning brain drain into brain gain. DFC
            membership is open to Nigerian physicians abroad, Nigeria-based
            consultants, and physicians in training.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/join"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-50 transition-colors"
            >
              Apply for membership
            </Link>
            <Link
              href="/second-opinion"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 transition-colors"
            >
              Request a second opinion
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <h2 className="text-2xl font-bold text-[#0D1F3C] mb-8">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {data.slice(0, 6).map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-[#0D1F3C] font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-6">
            <Link
              href="/faq"
              className="text-[#0D1F3C] font-medium underline underline-offset-2 hover:text-[#162d52]"
            >
              View all FAQs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
