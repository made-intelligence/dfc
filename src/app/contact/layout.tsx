import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | DFC",
  description:
    "Get in touch with the Doctors Foundation for Care. For membership enquiries, partnerships, second opinions, or technical support.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
