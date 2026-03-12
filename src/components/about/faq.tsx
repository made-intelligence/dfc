"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { data } from "./faqData";

const FAQ = () => {
  return (
    <>
            <div className="relative pt-24 md:pt-42 pb-24 overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="/dfc-logo.png"
                  alt="Healthcare team"
                  fill
                  className="object-cover opacity-10"
                  priority
                />
              </div>
    
              <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-primary">
                <h1 className="text-xl md:text-4xl font-bold leading-tight">
                 Frequently Asked Questions <br /> (FAQs)
                </h1>
              </div>
            </div>
      <div className="container mx-auto px-4 md:px-8 py-6">
        <Accordion type="single" collapsible className="w-full">
          {data.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-primary">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
};

export default FAQ;
