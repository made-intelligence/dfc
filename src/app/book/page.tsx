import type { Metadata } from "next";
import BookPageClient from "@/components/booking/BookPageClient";

export const metadata: Metadata = {
  title: "Book a Consultation with a Nigerian Diaspora Doctor",
  description:
    "Find and book consultations with verified Nigerian diaspora specialists. Search by specialty, view profiles, and schedule online appointments with world-trained physicians.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a Consultation — DFC Diaspora Doctors",
    description:
      "Search by specialty and book online consultations with verified Nigerian diaspora physicians practising in the UK, US, and beyond.",
    images: [{ url: "/hero.jpg", width: 1200, height: 630, alt: "Book a consultation with DFC doctors" }],
  },
};

export default function BookPage() {
  return <BookPageClient />;
}
