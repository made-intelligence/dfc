import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Doctors Foundation for Care. For membership enquiries, partnerships, second opinions, or technical support.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact DFC — Doctors Foundation For Care",
    description:
      "Reach out for membership enquiries, partnerships, second opinions, or support.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
