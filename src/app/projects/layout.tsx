import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects & Initiatives",
  description:
    "DFC projects and initiatives — from the Emergency Response Initiative (ERI) to community health outreach. See how Nigerian diaspora doctors are driving change.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects & Initiatives — DFC",
    description:
      "See DFC projects driving healthcare change in Nigeria — ERI, community outreach, specialist partnerships, and more.",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
