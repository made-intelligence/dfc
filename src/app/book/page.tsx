import type { Metadata } from "next";
import BookPageClient from "@/components/booking/BookPageClient";

export const metadata: Metadata = {
  title: "Book an Appointment | DFC",
  description:
    "Find and book appointments with top medical specialists. Search by specialty, view profiles, and schedule consultations effortlessly.",
  openGraph: {
    title: "Book an Appointment | DFC",
    description: "Connect with world-class doctors. Book your consultation today.",
  },
};

export default function BookPage() {
  return <BookPageClient />;
}
