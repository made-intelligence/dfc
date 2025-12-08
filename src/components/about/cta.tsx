"use client";

import { Button } from "../ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { data } from "./faqData";
import Link from "next/link";

export default function CTA() {

  return (
    <>
          <div className="bg-linear-to-r from-[#0A2463] to-blue-700 py-12 text-white">
            <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold mb-4">Key highlights</h2>
              <ul className="list-disc my-4 pl-8 text-white">
              <li>{`Reconnect with Home: Give back to Nigeria while staying fully engaged in your international career.`}</li>
              <li>{`Consult Without Borders: Offer teleconsultations, mentorship, and second opinions from anywhere, on your schedule.`}</li>
              <li>{`Earn Meaningfully: Generate income for your time and expertise while contributing to a mission that matters.`}</li>
              <li>{`Expand Your Reach: Build your personal brand and professional network across continents.`}</li>
              <li>{`Collaborate with Peers: Join a trusted community of Nigerian specialists creating solutions for homegrown challenges.`}</li>
              <li>{`Turn Brain Drain into Legacy: Be part of the generation redefining Nigerian healthcare for the better.`}</li>
            </ul>
              <Button
                className="cursor-pointer rounded-full bg-white text-[#0A2463] px-8 py-4 font-semibold hover:bg-gray-100 transition-colors"
              >
                Join DFC
              </Button>
            </div>
            </div>
                  <div className="container mx-auto px-4 md:px-8 mt-8 py-6">
        <h3 className="text-2xl text-primary font-bold mb-4">
          FAQs
        </h3>
        <Accordion type="single" collapsible className="w-full">
          {data.slice(0, 4).map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Link href="/faq">
          <Button className="border border-primary hover:bg-primary hover:text-white cursor-pointer" variant="outline">View All FAQs</Button>
        </Link>
      </div>
      </>
  );
}
