import type { Metadata } from "next";
import BookPageClient from "@/components/booking/BookPageClient";

export const metadata: Metadata = {
  title: "Book an Appointment | DFC",
  description:
    "Find and schedule consultations with DFC specialists. Search by specialty and view profiles.",
  openGraph: {
    title: "Book an Appointment | DFC",
    description: "Connect with DFC specialists. Schedule your consultation today.",
  },
};

export default function BookPage() {
  return <BookPageClient />;
}
