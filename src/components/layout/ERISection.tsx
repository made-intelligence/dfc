"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Siren,
  Phone,
  Users,
  GraduationCap,
  BarChart3,
  Banknote,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import { useCountUp } from "@/lib/useCountUp";

interface Pillar {
  id: string;
  name: string;
  subtitle: string | null;
  focus: string | null;
  outputs: string | null;
  order: number;
  memberCount: number;
  leads: { name: string; role: string }[];
}

interface ERIData {
  name: string;
  description: string | null;
  remit: string | null;
  expectedOutputs: string | null;
  pillarCount: number;
  memberCount: number;
  pillars: Pillar[];
}

const pillarIcons = [
  <Phone key="1" className="w-5 h-5" />,
  <Users key="2" className="w-5 h-5" />,
  <GraduationCap key="3" className="w-5 h-5" />,
  <BarChart3 key="4" className="w-5 h-5" />,
  <Banknote key="5" className="w-5 h-5" />,
  <Shield key="6" className="w-5 h-5" />,
];

const pillarColors = [
  { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", accent: "bg-red-600" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", accent: "bg-amber-600" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", accent: "bg-blue-600" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", accent: "bg-purple-600" },
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", accent: "bg-emerald-600" },
  { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", accent: "bg-slate-600" },
];

// Fallback data when API hasn't loaded
const FALLBACK: ERIData = {
  name: "Emergency Response Initiative",
  description:
    "A six-pillar technical working group developing Nigeria's national emergency response policy framework.",
  remit: null,
  expectedOutputs: null,
  pillarCount: 6,
  memberCount: 27,
  pillars: [
    { id: "1", name: "Emergency Referral, Coordination, Technology & Logistics", subtitle: "Backbone of the system", focus: null, outputs: null, order: 1, memberCount: 10, leads: [] },
    { id: "2", name: "Community Engagement, Communication & Civil Society Partnerships", subtitle: "System activation and trust", focus: null, outputs: null, order: 2, memberCount: 11, leads: [] },
    { id: "3", name: "Emergency Workforce Training & Preparedness", subtitle: "People make the system work", focus: null, outputs: null, order: 3, memberCount: 11, leads: [] },
    { id: "4", name: "Gap Analysis, Data Collection & Monitoring", subtitle: "Evidence and accountability", focus: null, outputs: null, order: 4, memberCount: 6, leads: [] },
    { id: "5", name: "Financing, Reimbursement & Sustainability", subtitle: "The engine that keeps it running", focus: null, outputs: null, order: 5, memberCount: 2, leads: [] },
    { id: "6", name: "Governance, Partnerships & Scale", subtitle: "Making it last and grow", focus: null, outputs: null, order: 6, memberCount: 10, leads: [] },
  ],
};

export default function ERISection() {
  const [eri, setEri] = useState<ERIData>(FALLBACK);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();

  const memberCount = useCountUp({ end: eri.memberCount, isVisible: statsVisible, duration: 2000 });
  const pillarCount = useCountUp({ end: eri.pillarCount, isVisible: statsVisible, duration: 1500 });

  useEffect(() => {
    fetch("/api/public/initiatives/eri")
      .then((res) => res.json())
      .then((data) => {
        if (data.initiative) setEri(data.initiative);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative py-20 sm:py-24 bg-[#0D1F3C] overflow-hidden">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Accent glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <Siren className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              Flagship Initiative 2026
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-white leading-tight">
            Emergency Response Initiative
          </h2>

          <p className="mt-5 text-lg text-white/65 leading-relaxed max-w-2xl mx-auto">
            {eri.description}
          </p>
        </div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          className="grid grid-cols-3 max-w-lg mx-auto mb-16 divide-x divide-white/10"
        >
          <div className="text-center py-2">
            <p className="text-3xl sm:text-4xl font-bold text-white">{pillarCount}</p>
            <p className="text-sm text-white/50 mt-1">Pillars</p>
          </div>
          <div className="text-center py-2">
            <p className="text-3xl sm:text-4xl font-bold text-white">{memberCount}+</p>
            <p className="text-sm text-white/50 mt-1">Physicians</p>
          </div>
          <div className="text-center py-2">
            <p className="text-3xl sm:text-4xl font-bold text-white">1</p>
            <p className="text-sm text-white/50 mt-1">Goal</p>
          </div>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eri.pillars.map((pillar, i) => {
            const color = pillarColors[i] || pillarColors[0];
            const icon = pillarIcons[i] || pillarIcons[0];
            const isExpanded = expandedPillar === pillar.id;

            return (
              <div
                key={pillar.id}
                className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.09] transition-colors"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold ${color.text} ${color.bg} px-2 py-0.5 rounded-full`}>
                      Pillar {pillar.order}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white leading-snug mb-1">
                  {pillar.name}
                </h3>
                {pillar.subtitle && (
                  <p className="text-sm text-white/40 italic mb-3">
                    {pillar.subtitle}
                  </p>
                )}

                <div className="flex items-center gap-3 text-sm text-white/50 mb-3">
                  <span>{pillar.memberCount} members</span>
                  {pillar.leads.length > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span>
                        {pillar.leads.map((l) => l.name.split(" ")[0]).join(", ")}
                      </span>
                    </>
                  )}
                </div>

                {pillar.focus && (
                  <button
                    onClick={() =>
                      setExpandedPillar(isExpanded ? null : pillar.id)
                    }
                    className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    {isExpanded ? "Less" : "Focus areas"}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {isExpanded && pillar.focus && (
                  <p className="mt-3 text-sm text-white/50 leading-relaxed border-t border-white/10 pt-3">
                    {pillar.focus}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-white/50 text-base mb-6 max-w-xl mx-auto">
            The ERI is an open technical working group. DFC members with relevant
            expertise are welcome to contribute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/initiatives/eri"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-100 transition-colors"
            >
              Learn about the ERI
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/join"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 transition-colors"
            >
              Join DFC
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
