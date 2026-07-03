"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  Siren,
  Phone,
  Users,
  GraduationCap,
  BarChart3,
  Banknote,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
];

const FALLBACK: ERIData = {
  name: "Emergency Response Initiative",
  description:
    "A six-pillar technical working group developing Nigeria's national emergency response policy framework.",
  remit: "Catalysed by the road traffic accident involving Anthony Joshua in early 2026, the ERI focuses on pre-hospital care, workforce training, community engagement, data collection, financing, and governance. The goal is to produce actionable policy outputs, engage the Federal Ministry of Health, and build a replicable emergency response model for Nigeria.",
  expectedOutputs:
    "National emergency response policy framework, referral SOPs, training curricula, financing strategy, government engagement roadmap.",
  pillarCount: 6,
  memberCount: 27,
  pillars: [
    { id: "1", name: "Emergency Referral, Coordination, Technology & Logistics", subtitle: "Backbone of the system", focus: "Hospital and ambulance onboarding. 24/7 emergency contact system. Referral criteria and acceptance processes. Coordination hub or call centre. Communication tools and workflows. Ambulance equipment standards, medical supplies, stocking, maintenance, distribution.", outputs: "Participating facility and ambulance directory. Emergency contact roster. Referral and coordination SOPs. Logistics and equipment readiness checklist.", order: 1, memberCount: 10, leads: [] },
    { id: "2", name: "Community Engagement, Communication & Civil Society Partnerships", subtitle: "System activation and trust", focus: "Community education and preparedness. Knowing who to call, what to do, and what not to do. Local first response and bystander action. Partnerships with CSOs, faith-based groups, transport unions, community leaders.", outputs: "Community engagement protocols and roadmaps. Public education materials. Communication initiatives via local, social, and contemporary media. Civil society partnership framework.", order: 2, memberCount: 11, leads: [] },
    { id: "3", name: "Emergency Workforce Training & Preparedness", subtitle: "People make the system work", focus: "First responder and ambulance staff training. Basic life support and trauma response. Hospital receiving team readiness. BLS, ACLS, PALS workflows. Simulation drills and preparedness exercises.", outputs: "Training curricula and schedules. Skills checklists and certification pathways. Hospital and responder preparedness standards.", order: 3, memberCount: 11, leads: [] },
    { id: "4", name: "Gap Analysis, Data Collection & Monitoring", subtitle: "Evidence and accountability", focus: "Baseline gap analysis across the emergency response pathway. Data on response times, referrals, logistics readiness, training gaps, outcomes. Continuous monitoring and quality improvement.", outputs: "Gap analysis framework and reports. Data collection tools. Dashboards and performance indicators.", order: 4, memberCount: 6, leads: [] },
    { id: "5", name: "Financing, Reimbursement & Sustainability", subtitle: "The engine that keeps it running", focus: "Emergency care costing. Reimbursement pathways for ambulances and hospitals. NHIS, HMO, insurance, donor, and PPP engagement. Funding models for logistics, training, and coordination.", outputs: "Emergency reimbursement framework. Funding and donor engagement strategy. Sustainability plan.", order: 5, memberCount: 2, leads: [] },
    { id: "6", name: "Governance, Partnerships & Scale", subtitle: "Making it last and grow", focus: "Oversight and accountability. Government engagement and alignment. Policy integration. Scale-up across states and nationally.", outputs: "Governance and decision-making framework. Partnership agreements. Scale-up and national adoption roadmap.", order: 6, memberCount: 10, leads: [] },
  ],
};

export default function ERIPage() {
  const [eri, setEri] = useState<ERIData>(FALLBACK);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/initiatives/eri")
      .then((res) => res.json())
      .then((data) => {
        if (data.initiative) setEri(data.initiative);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Topbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0D1F3C] overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-16 lg:pt-36 lg:pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <Siren className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">
                Flagship Initiative 2026
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Emergency Response Initiative
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {eri.description}
            </p>
            <div className="mt-8 grid grid-cols-3 max-w-md mx-auto divide-x divide-white/10">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {eri.pillarCount}
                </p>
                <p className="text-sm text-white/50 mt-1">Pillars</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {eri.memberCount}+
                </p>
                <p className="text-sm text-white/50 mt-1">Physicians</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">1</p>
                <p className="text-sm text-white/50 mt-1">Goal</p>
              </div>
            </div>
          </div>
        </section>

        {/* Remit */}
        {eri.remit && (
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-3xl mx-auto px-6 sm:px-8">
              <h2 className="text-2xl font-bold text-[#0D1F3C] mb-6">
                Background
              </h2>
              <p className="text-base text-gray-700 leading-relaxed">
                {eri.remit}
              </p>
              {eri.expectedOutputs && (
                <>
                  <h3 className="text-lg font-semibold text-[#0D1F3C] mt-8 mb-3">
                    Expected outputs
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {eri.expectedOutputs}
                  </p>
                </>
              )}
            </div>
          </section>
        )}

        {/* Pillars */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <h2 className="text-2xl font-bold text-[#0D1F3C] mb-10 text-center">
              The six pillars
            </h2>
            <div className="space-y-4">
              {eri.pillars.map((pillar, i) => {
                const color = pillarColors[i] || pillarColors[0];
                const icon = pillarIcons[i] || pillarIcons[0];
                const isExpanded = expandedPillar === pillar.id;

                return (
                  <div
                    key={pillar.id}
                    className={`bg-white rounded-2xl border ${color.border} p-6 sm:p-8`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold ${color.text} ${color.bg} px-2.5 py-0.5 rounded-full`}
                          >
                            Pillar {pillar.order}
                          </span>
                          <span className="text-sm text-gray-500">
                            {pillar.memberCount} members
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[#0D1F3C] leading-snug">
                          {pillar.name}
                        </h3>
                        {pillar.subtitle && (
                          <p className="text-sm text-gray-500 italic mt-0.5">
                            {pillar.subtitle}
                          </p>
                        )}

                        {pillar.leads.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Led by:</span>{" "}
                            {pillar.leads
                              .map((l) => `${l.name} (${l.role.replace("_", "-")})`)
                              .join(", ")}
                          </p>
                        )}

                        <button
                          onClick={() =>
                            setExpandedPillar(isExpanded ? null : pillar.id)
                          }
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0D1F3C] hover:text-[#162d52] cursor-pointer"
                        >
                          {isExpanded ? "Show less" : "View focus areas & outputs"}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                            {pillar.focus && (
                              <div>
                                <h4 className="text-sm font-semibold text-[#0D1F3C] mb-1">
                                  Focus areas
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {pillar.focus}
                                </p>
                              </div>
                            )}
                            {pillar.outputs && (
                              <div>
                                <h4 className="text-sm font-semibold text-[#0D1F3C] mb-1">
                                  Key outputs
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {pillar.outputs}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0D1F3C] py-16">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Contribute to the ERI
            </h2>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-lg mx-auto">
              The ERI is an open technical working group. DFC members with
              relevant expertise in emergency medicine, policy, logistics,
              training, financing, or governance are welcome to join.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/join"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-50 transition-colors"
              >
                Join DFC
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 transition-colors"
              >
                Contact the secretariat
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
