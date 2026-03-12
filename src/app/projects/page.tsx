"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  Heart,
  BookOpen,
  Handshake,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  summary: string;
  status: string;
  type: string | null;
}

const pillarConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  HEALTH: {
    icon: <Heart className="w-5 h-5" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  EDUCATION: {
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  COMMUNITY: {
    icon: <Handshake className="w-5 h-5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  CLINICAL: {
    icon: <Stethoscope className="w-5 h-5" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
};

const fallbackProjects: (Project & { pillar: string })[] = [
  {
    id: "1",
    title: "Health Outreaches & Camps",
    summary:
      "DFC physicians run free clinics, surgical camps, and screening programmes in communities that need them most.",
    description:
      "Our members organise and participate in health outreach programmes across Nigeria. These include free clinics in underserved communities, specialist surgical camps, and disease screening initiatives. Each outreach is coordinated with local hospitals and community leaders to ensure maximum impact.",
    pillar: "HEALTH",
    status: "ACTIVE",
    type: null,
  },
  {
    id: "2",
    title: "Training & Mentorship",
    summary:
      "Hands-on fellowships and mentorship pairing young Nigerian doctors with experienced diaspora specialists.",
    description:
      "DFC members mentor and train the next generation of Nigerian doctors through structured fellowships, clinical attachments, and skills transfer sessions. The programme pairs junior doctors in Nigeria with senior diaspora specialists for ongoing professional development.",
    pillar: "EDUCATION",
    status: "ACTIVE",
    type: null,
  },
  {
    id: "3",
    title: "Specialist Directory",
    summary:
      "A peer-verified directory connecting patients and hospitals with Nigerian specialist physicians worldwide.",
    description:
      "The DFC specialist directory is a curated, peer-verified listing of Nigerian physicians both in the diaspora and at home. It enables patients and hospitals to find and connect with trusted specialists across over 22 medical specialties.",
    pillar: "COMMUNITY",
    status: "ACTIVE",
    type: null,
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] =
    useState<(Project & { pillar: string })[]>(fallbackProjects);

  useEffect(() => {
    fetch("/api/public/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects?.length > 0) setProjects(data.projects);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Topbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0D1F3C] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-16 lg:pt-36 lg:pb-20 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Programmes & Initiatives
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Where DFC members are making a difference. From health outreaches
              to policy work, here is what we are doing.
            </p>
          </div>
        </section>

        {/* ERI Banner */}
        <section className="bg-[#0D1F3C] border-t border-white/10">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
            <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">
                  Flagship 2026
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Emergency Response Initiative
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  A six-pillar technical working group developing Nigeria&apos;s
                  national emergency response policy framework.
                </p>
              </div>
              <Link
                href="/initiatives/eri"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0D1F3C] font-semibold text-sm hover:bg-gray-100 transition-colors shrink-0"
              >
                Learn more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <div className="space-y-6">
              {projects.map((project) => {
                const config =
                  pillarConfig[project.pillar] || pillarConfig.COMMUNITY;
                return (
                  <div
                    key={project.id}
                    className="bg-gray-50 rounded-2xl border border-gray-100 p-6 sm:p-8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}
                      >
                        {config.icon}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        {project.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#0D1F3C] mb-2">
                      {project.title}
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                      {project.description || project.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
