import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask a DFC Specialist",
  description:
    "Submit clinical questions and get answers from verified diaspora physicians at the Doctors Foundation for Care.",
};

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
