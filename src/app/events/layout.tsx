import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming DFC events, medical conferences, AGMs, and community gatherings. Stay connected with the Nigerian diaspora healthcare community.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Events — Doctors Foundation For Care",
    description:
      "Upcoming DFC events, medical conferences, and community gatherings for diaspora healthcare professionals.",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
