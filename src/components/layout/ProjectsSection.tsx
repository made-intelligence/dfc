"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Users, Globe, BookOpen, Handshake, Stethoscope } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  pillar: string;
  status: string;
}

const pillarConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  HEALTH: {
    icon: <Heart className="w-5 h-5" />,
    label: "Health",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  EDUCATION: {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Education",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  COMMUNITY: {
    icon: <Handshake className="w-5 h-5" />,
    label: "Community",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  CLINICAL: {
    icon: <Stethoscope className="w-5 h-5" />,
    label: "Clinical",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
};

const fallbackProjects: Project[] = [
  {
    id: "1",
    title: "Health Outreaches & Camps",
    description:
      "DFC physicians run free clinics, surgical camps, and screening programmes in communities that need them most.",
    pillar: "HEALTH",
    status: "ACTIVE",
  },
  {
    id: "2",
    title: "Training & Mentorship",
    description:
      "Hands-on fellowships and mentorship pairing young Nigerian doctors with experienced diaspora specialists.",
    pillar: "EDUCATION",
    status: "ACTIVE",
  },
  {
    id: "3",
    title: "Specialist Directory",
    description:
      "A peer-verified directory that connects patients and hospitals with Nigerian specialist physicians worldwide.",
    pillar: "COMMUNITY",
    status: "ACTIVE",
  },
];

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);

  useEffect(() => {
    fetch("/api/public/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects?.length > 0) {
          setProjects(data.projects.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="projects" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Ongoing programmes
            </h2>
            <p className="mt-3 text-base text-gray-600 max-w-lg leading-relaxed">
              Beyond the ERI, here is where DFC members are making a difference.
            </p>
          </div>
          <Link
            href="/projects"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-[#0D1F3C] font-medium hover:underline"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((project) => {
            const config = pillarConfig[project.pillar] || pillarConfig.COMMUNITY;
            return (
              <div
                key={project.id}
                className="group relative bg-gray-50 rounded-2xl border border-gray-100 p-6 hover:bg-white hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200 hover:border-gray-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}
                  >
                    {config.icon}
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#0D1F3C] mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  {project.description}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#0D1F3C] opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
