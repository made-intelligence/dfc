"use client";

import {
  Stethoscope,
  FileSearch,
  Building2,
  GraduationCap,
  ScrollText,
  Globe,
} from "lucide-react";

const cards = [
  {
    icon: <Stethoscope className="w-6 h-6" />,
    iconBg: "bg-[#0A4A50]/10",
    iconColor: "text-[#0A4A50]",
    heading: "Specialist visits",
    body: "Members publish their availability in Nigeria. Individuals and hospitals book directly around their schedule.",
  },
  {
    icon: <FileSearch className="w-6 h-6" />,
    iconBg: "bg-[#0D1F3C]/10",
    iconColor: "text-[#0D1F3C]",
    heading: "Second opinions",
    body: "Independent case reviews from diaspora-trained specialists. Written report, no travel required.",
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    iconBg: "bg-[#D4A017]/10",
    iconColor: "text-[#D4A017]",
    heading: "Health outreaches & camps",
    body: "Free clinics, surgical camps, and screening programmes in communities that need them most.",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    iconBg: "bg-[#0A4A50]/10",
    iconColor: "text-[#0A4A50]",
    heading: "Training & mentorship",
    body: "Hands-on fellowships and mentoring for Nigerian doctors in training, led by experienced diaspora specialists.",
  },
  {
    icon: <ScrollText className="w-6 h-6" />,
    iconBg: "bg-[#0D1F3C]/10",
    iconColor: "text-[#0D1F3C]",
    heading: "Policy & advocacy",
    body: "Technical working groups developing policy frameworks, including the Emergency Response Initiative.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    iconBg: "bg-[#0A4A50]/10",
    iconColor: "text-[#0A4A50]",
    heading: "Specialist directory",
    body: "A peer-verified network of Nigeria-based consultants for referrals and collaboration.",
  },
];

export default function WhyChooseDFC() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
            What DFC does
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            Nigeria&apos;s healthcare system is under strain, but the solution
            exists within our own global medical community. DFC transforms
            goodwill into impact.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.heading}
              className="group bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-gray-200"
            >
              <div
                className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-4`}
              >
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#0D1F3C] mb-2">
                {card.heading}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
